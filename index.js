(function(process, logger){
	'use strict';

	const fs = require('fs'),
		path = require('path'),
		os = require('os'),
		Sequelize = require('sequelize'),
		redis = require('redis'),
		Q = require('q'),
		schedule = require('node-schedule'),
		readline = require('readline'),
		parseString = require('xml2js').parseString,
		lib = require('require.all')('./routes');

	const config = require('./config.json');

	const redisclient = redis.createClient(config.redis.port, config.redis.host);
	const redispublish = redis.createClient(config.redis.port, config.redis.host);


	const supportedCommandsDescription = {
		'reload': 'Reload jobs file',
		'runall': 'Runs all available commands',
		'help': 'Show the list of available commands',
		'?': 'Help alias',
		'quit': 'Exits'
	};
	

	let jobs = [],
		crons = [],
		connection = false;
	
	redisclient.on('error', function (err) {
		logger.error('Error REDIS:', err);
	});

	if (config.redis.password){
		redisclient.auth(config.redis.password);
	}

	function generator(functionname, obj, key, params){
		return function(){
			return Reflect.apply(functionname, obj, [connection, params]).then(function(value){
				let newkey = key;
				if (typeof params === 'object'){
					newkey = Object.keys(params).reduce(function(p, c){
						return p.replace(':' + c, params[c]);
					}, newkey);
				}
				logger.log(newkey);
				redisclient.set(newkey, JSON.stringify(value), redis.print);
				redispublish.publish(newkey, JSON.stringify(value));
				redispublish.publish('updates', newkey);
				if (config.debug){
					logger.log('Event OK:', newkey, 'The length of the new stored value is:', JSON.stringify(value).length);
				}
			}, function(err){
				logger.error(key, err);
			});
		};
	}

	function caller(functionname, obj, key, parameters){
		return function(){
			if (typeof parameters === 'undefined'){
				generator(functionname, obj, key)();
			} else {
				let callingparams = [{}];
				for (const attr in parameters){
					
					const possiblevalues = parameters[attr];

					const cp = [];
					do {
						const p = callingparams.shift();

						for (const value in possiblevalues){
							p[attr] = possiblevalues[value];
							cp.push(JSON.parse(JSON.stringify(p)));
						}

					} while (callingparams.length);

					callingparams = cp;
				}

				const fns = callingparams.map(function(p){
					return generator(functionname, obj, key, p);
				});

				fns.reduce(Q.when, Q(0)).then(function(){
					//logger.log('Every parameter option has been runned');
				}).fail(function(err){
					logger.error('fallo', err);
				});

			}
		};
	}

	function runCommand(cmd){

		const p = cmd.trim() === 'runall' ? jobs : jobs.filter(function(job){
			return job.$.key === cmd;
		});

		if (p.length > 0){
			p.forEach(function(job){
				const methodname = job.$.method.split('.');
				const obj = lib[methodname[0]],
					functionname = lib[methodname[0]][methodname[1]];

				let parameters = false;

				if (job.parameters){
					parameters = job.parameters[0].field.reduce(function(prev, parameter){
						prev[parameter.$.name] = parameter.value;

						return prev;
					}, {});
				}
				const fn = caller(functionname, obj, job.$.key, parameters);
				fn();
			});
		} else {
			logger.error('Wrong command:', cmd, 'Enter help for available commands');
		}
	}

	process.on('SIGINT', function(){
		connection.close();
		process.exit(0);
	});

	function connect(){
		if (config.db.options.logging){
			config.db.options.logging = logger.log;
		}
		connection = new Sequelize(config.db.database, config.db.username, config.db.password, config.db.options);

		Sequelize.Promise = require('q');
		
		return connection.authenticate();
	}

	function loadXML(){
		const jobsdeferred = Q.defer();

		if (config.jobsDirectory){
			fs.readdir(path.join(__dirname, config.jobsDirectory), (err, files) => {
				if (err){
					logger.error(path.join(__dirname, config.jobsDirectory), 'is not readable or doesn\'t exist.');

					return jobsdeferred.reject(err);
				}

				return Q.all(
					files.filter((file) => file.endsWith('.xml')).map((file) => {
						const defer = Q.defer();
						fs.readFile(path.join(__dirname, config.jobsDirectory, file), 'utf8', defer.makeNodeResolver());

						return defer.promise;
					})
				).then((c) => jobsdeferred.resolve(c)).catch((e) => jobsdeferred.reject(e));
			});
		} else {
			fs.readFile(path.join(__dirname, 'jobs.xml'), 'utf8', jobsdeferred.makeNodeResolver());
		}

		return jobsdeferred.promise;
	}

	function xml2jobs(xml){
		if (typeof xml === 'object' && Array.isArray(xml)){
			return Q.all(xml.map(function(data){
				const paserDefer = Q.defer();

				parseString(data, paserDefer.makeNodeResolver());

				return paserDefer.promise;

			})).then(function(datas){
				return datas.reduce(function(p, c){
					p.jobs.job = p.jobs.job.concat(c.jobs.job);

					return p;
				}, {jobs: {job: []}});
			});
		}

		const paserDefer = Q.defer();
		parseString(xml, paserDefer.makeNodeResolver());

		return paserDefer.promise;
	}

	function cancelAllCrons(){
		crons.forEach(function(c){
			c.cancel();
		});
		crons = [];
	}

	function setJobs(jbs){
		cancelAllCrons();

		jobs = jbs.jobs.job;
		crons = jobs.map(function(job){
			const cronmatching = job.$.cron;
			const methodname = job.$.method.split('.');
			const obj = lib[methodname[0]],
				functionname = typeof lib[methodname[0]][methodname[1]] === 'undefined' ? false : lib[methodname[0]][methodname[1]];
			let parameters = false;

			if (!obj || !functionname){
				logger.error('Bad configuration!', methodname[0], methodname[1]);

				return false;
			}

			if (job.parameters){
				parameters = job.parameters[0].field.reduce(function(prev, parameter){
					prev[parameter.$.name] = parameter.value;

					return prev;
				}, {});
			}
			const fn = caller(functionname, obj, job.$.key, parameters);

			return schedule.scheduleJob(cronmatching, fn);
		}).filter(function(a){ return a; });
	}

	const supportedCommands = {
		reload: function(){
			return loadXML().then(function(content){

				return xml2jobs(content);
			}).then(function(jbs){
				setJobs(jbs);
				logger.log('OK');
			}).catch(function(err){
				logger.error(err);
			});
		},
		runall: function(){
			jobs.map(function(job){
				return job.$.key;
			}).forEach(function(c){
				runCommand(c);
			});
		},
		help: function(){
			const comms = Object.keys(supportedCommands).map(function(s){
				return s + (typeof supportedCommandsDescription[s] === 'string' ? os.EOL + "\t" + supportedCommandsDescription[s] : '');
			});
			const options = jobs.map(function(job){
				return job.$.key + (job.description ? os.EOL + "\t" + job.description : '');
			}).concat(comms);

			logger.log(os.EOL, 'The available options are:', os.EOL);
			logger.log(options.join(os.EOL));
		},
		'?': function(){
			supportedCommands.help();
		},
		quit: function(){
			cancelAllCrons();
			connection.close();
			process.exit(0);
		}
	};

	function completer(line) {
		const comms = Object.keys(supportedCommands);
		const options = jobs.map(function(job){
			return job.$.key;
		}).concat(comms);

		const hits = options.filter((c) => c.startsWith(line));

		return [hits.length ? hits : options, line];
	}

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		prompt: 'COMMAND> ',
		completer: completer
	});

	Q.all([loadXML(), connect()]).then(function(content){

		return xml2jobs(content[0]);
	}).then(function(jbs){
		setJobs(jbs);
		rl.prompt();
	}).catch(function(err){
		logger.error(err);
		process.exit(-1);
	});

	process.on('exit', function(){
		cancelAllCrons();
		connection.close();
	});

	rl.on('line', function(line){
		if (line.trim() !== ''){
			const prefix = line.split(' ')[0];

			if (typeof supportedCommands[prefix] === 'function'){
				supportedCommands[prefix](line);
			} else {
				runCommand(line.trim());
			}
		}
		rl.prompt();
	}).on('close', function(){
		process.exit(0);
	});

})(process, console);
