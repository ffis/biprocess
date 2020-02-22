(function(process, logger){
	'use strict';

	const fs = require('fs'),
		path = require('path'),
		os = require('os'),
		redis = require('redis'),
		Q = require('q'),
		schedule = require('node-schedule'),
		readline = require('readline'),
		globToRegExp = require('glob-to-regexp'),
		parseString = require('xml2js').parseString,
		lib = require('require.all')('./routes');

	const config = require('./config.json');

	const redisclient = redis.createClient(config.redis.port, config.redis.host);
	const redispublish = redis.createClient(config.redis.port, config.redis.host);
	const redissubscribe = redis.createClient(config.redis.port, config.redis.host);

	const supportedCommandsDescription = {
		'reload': 'Reload jobs file',
		'runall': 'Runs all available commands',
		'help': 'Show the list of available commands',
		'?': 'Help alias',
		'quit': 'Exits'
	};

	let jobs = [],
		crons = [],
		connection = false,
		mongodbclient = false;

	redisclient.on('error', function (err) {
		logger.error('Error REDIS:', err);
	});

	if (config.redis.password) {
		redisclient.auth(config.redis.password);
		redispublish.auth(config.redis.password);
		redissubscribe.auth(config.redis.password);
	}

	function generator(functionname, obj, key, params) {
		return function() {

			params.connection = connection;
			params.mongodbclient = mongodbclient;
			params.config = config;

			return Reflect.apply(functionname, obj, [params]).then(function(value){
				let newkey = key;
				if (typeof params === 'object'){
					newkey = Object.keys(params).reduce(function(p, c){
						return p.replace(':' + c, params[c]);
					}, newkey);
				}
				logger.log(newkey);
				const stringfied = JSON.stringify(value);
				redisclient.set(newkey, stringfied, redis.print);
				redispublish.publish(newkey, stringfied);
				redispublish.publish('updates', newkey);
				if (config.debug){
					logger.log('Event OK:', newkey, 'The length of the new stored value is:', stringfied.length);
				}
			}, function(err){
				logger.error(key, err);
			});
		};
	}

	function caller(functionname, obj, key, parameters) {
		return function() {
			if (typeof parameters === 'undefined') {
				return generator(functionname, obj, key)();
			}

			let callingparams = [{}];
			for (const attr in parameters) {

				const possiblevalues = parameters[attr];

				const cp = [];
				do {
					const p = callingparams.shift();

					for (const value in possiblevalues) {
						p[attr] = possiblevalues[value];
						cp.push(JSON.parse(JSON.stringify(p)));
					}

				} while (callingparams.length);

				callingparams = cp;
			}

			const fns = callingparams.map(function(p) {
				return generator(functionname, obj, key, p);
			});

			return Q.all([fns.reduce(Q.when, Q(0)).then(function(){
				//logger.log('Every parameter option has been runned');
			}).fail(function(err){
				logger.error('fallo', err);
			})]);
		};
	}

	function runCommand(cmd) {
		const p = cmd.trim() === 'runall' ? jobs : jobs.filter(function(job){
			return cmd.indexOf('*') >= 0 ? globToRegExp(cmd).test(job.$.key) : job.$.key === cmd;
		});

		if (p.length === 0){
			logger.error('Wrong command:', cmd, 'Enter help for available commands');

			return Q(false);
		}

		return Q.all(p.map(function(job){
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

			return fn();
		}));
	}

	process.on('SIGINT', function(){
		if (connection) {
			connection.close();
		}
		if (mongodbclient) {
			mongodbclient.close();
		}

		process.exit(0);
	});

	function connect() {
		const Sequelize = require('sequelize');

		if (config.db.options.logging) {
			config.db.options.logging = logger.log;
		}
		connection = new Sequelize(config.db.database, config.db.username, config.db.password, config.db.options);

		Sequelize.Promise = require('q');

		return connection.authenticate();
	}

	function connectMongo() {
		const MongoClient = require('mongodb').MongoClient;
		const options = config.mongodb.options ? config.mongodb.options : {useNewUrlParser: true, useUnifiedTopology: true};

		return MongoClient
			.connect(config.mongodb.url, options)
			.then((client) => mongodbclient = client);
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

	function safeexit() {
		cancelAllCrons();
		if (connection) {
			connection.close();
		}
		if (mongodbclient) {
			mongodbclient.close();
		}
		redisclient.quit();
		redispublish.quit();
		redissubscribe.quit();

		process.exit(0);
	}

	function setJobs(jbs){
		cancelAllCrons();

		jobs = jbs.jobs.job;
		crons = jobs.filter(function (job){
			return job.$.cron;
		}).map(function (job){
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
			return Q.all(jobs.map(function(job){
				return job.$.key;
			}).map(function(c){
				return runCommand(c);
			}));
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

			return Q(true);
		},
		'?': function(){
			return supportedCommands.help();
		},
		quit: function(){
			safeexit();
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

	const rl = (process.argv.indexOf('-q') < 0) ? readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		prompt: 'COMMAND> ',
		completer: completer
	}) : false;

	const loadingSteps = [];

	loadingSteps.push(loadXML());

	if (config.db && config.db.enabled) {
		loadingSteps.push(connect());
	}

	if (config.mongodb && config.mongodb.enabled) {
		loadingSteps.push(connectMongo());
	}

	Q.all(loadingSteps)
		.then((content) => xml2jobs(content[0]))
		.then(function(jbs){
			setJobs(jbs);
			rl && rl.prompt();
		}).catch(function(err){
			logger.error(err);
			process.exit(-1);
		});

	process.on('exit', function(){
		safeexit();
	});

	function runEnteredCommand(line) {
		if (line.trim() !== ''){
			const prefix = line.startsWith('/') ? line.substring(1).split(' ')[0] : line.split(' ')[0];

			if (typeof supportedCommands[prefix] === 'function'){
				return supportedCommands[prefix](line);
			}

			return runCommand(line.trim());
		}

		return Q(true);
	}

	if (rl) {
		rl.on('line', function(line){
			runEnteredCommand(line).then(function() {
				rl.prompt();
			}).catch(function(err) {
				rl.prompt();
			});
		}).on('close', function(){
			process.exit(0);
		});
	}

	const channels2subscribe = config.redis.channels && Array.isArray(config.redis.channels.listen) ? config.redis.channels.listen : [];
	channels2subscribe.forEach((channel) => {
		redissubscribe.subscribe(channel);
	});

	if (channels2subscribe.length > 0) {
		redissubscribe.on('message', (channel, message) => {
			if (jobs && Array.isArray(jobs)) {
				const triggeredJobs = jobs.filter((j) => j.triggers && j.triggers.filter((trigger) => trigger.on.filter((event) => event.$.action === channel && message.includes(event.$.contains)).length > 0).length > 0);

				triggeredJobs.forEach((job) => {
					runCommand(job.$.key);
				});
			}
		});
	}

	if (config.server && config.server.enabled) {
		if (config.server.port) {
			const app = require('express')();
			app.get('*', function(req, res) {

				if (req.originalUrl === '/') {
					const comms = Object.keys(supportedCommands);
					const options = jobs.map(function(job){
						return job.$.key;
					}).concat(comms);

					res.json(options);
				} else {
					redisclient.get(req.originalUrl, function(err, val) {
						if (err) {
							res.status(500).json(err);
						} else if (val) {
							res.type('application/json').send(val).end();
						} else {
							res.status(404).type('application/json').send('404').end();
						}
					});
				}
			}).post('*', function(req, res) {
				runEnteredCommand(req.originalUrl).then(function() {
					res.json(req.originalUrl);
				}).catch(function(err) {
					res.status(500).json(err);
				});
			});

			app.listen(config.server.port, config.server.bind);
			logger.error('Listenning on port', config.server.port);
		} else {
			logger.error('Cannot listen on unspecified port');
		}
	}

	process.on('uncaughtException', (s) => {
		console.error('uncaughtException');
		console.error(s);

		throw s;
	});

})(process, console);
