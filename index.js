(function(process, logger){
	'use strict';

	const fs = require('fs'),
		sql = require('mssql'),
		redis = require('redis'),
		Q = require('q'),
		schedule = require('node-schedule'),
		readline = require('readline'),
		parseString = require('xml2js').parseString,
		lib = {
			'util': require('./routes/util')
		};

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		prompt: 'COMMAND> '
	});

	const config = require('./config.json');

	const connectiondeferred = Q.defer();
	const jobsdeferred = Q.defer();

	const redisclient = redis.createClient(config.redis.port, config.redis.host);
	const redispublish = redis.createClient(config.redis.port, config.redis.host);
	const connection = new sql.Connection(config.db, connectiondeferred.makeNodeResolver());

	let jobs = [];

	fs.readFile('jobs.xml', 'utf8', jobsdeferred.makeNodeResolver());

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
					for (const p in params){
						newkey = newkey.replace(':' + p, params[p]);
					}
				}
				logger.log(newkey);
				redisclient.set(newkey, JSON.stringify(value), redis.print);
				redispublish.publish(newkey, JSON.stringify(value));
				redispublish.publish('updates', newkey);
//				logger.log(newkey, JSON.stringify(value).length, 'ok');
			}).fail(function(err){
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
					//logger.log('todas terminadas');
				}).fail(function(err){
					logger.error('fallo', err);
				});

			}
		};
	}

	function runCommand(cmd){
		const p = jobs.filter(function(job){
			return job.$.key === cmd;
		});

		if (p.length > 0){
			const job = p[0];
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
		} else {
			logger.log('Wrong command');
		}
	}

	process.on('SIGINT', function(){
		connection.close();
		process.exit(0);
	});

	rl.on('line', function(line){
		if (line.trim() !== ''){
			runCommand(line.trim());
		}
		rl.prompt();
	}).on('close', function(){
		process.exit(0);
	});

	Q.all([jobsdeferred.promise, connectiondeferred.promise]).then(function(content){

		parseString(content[0], function(err, jbs) {
			if (err){
				logger.error(err);
				process.exit(-1);
			}
			if (process.argv.length > 2){
				runCommand(process.argv[2]);
			} else {
				jobs = jbs.jobs.job;
				const crons = jobs.map(function(job){

					const cronmatching = job.$.cron;
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

					return schedule.scheduleJob(cronmatching, fn);
				});


				process.on('exit', function(){
					crons.forEach(function(c){
						c.cancel();
					});
				});
			}

			rl.prompt();
		});

	}).fail(function(err){
		logger.error(err);
	});

})(process, console);
