import { EOL } from "os";

import { createClient, RedisClient, print } from "redis";

import { connect, MongoClient, MongoClientOptions } from "mongodb";
import { Sequelize } from "sequelize";
import { Request, Response} from "express";
import * as express from "express";

import { calculateKey, loadXML, xml2jobs } from "./utils";

import * as readline from "readline";
import { scheduleJob } from "node-schedule";
import { isAbsolute, resolve } from "path";
import { readFileSync } from "fs";
import { JobList, JobElement } from "./types";

import { Command } from "commander";

import GlobToRegExp = require("glob-to-regexp");

const lib = require("require.all")("./routes");

const packagedescription = JSON.parse(readFileSync(resolve(__dirname, "..", "package.json"), "utf-8"));

const program = new Command();

program
	.version(packagedescription.version)
	.option("-c, --config <file>", "Sets the config file this program will use")
	.option("-q, --quiet", "Disable interactive shell");

program.parse(process.argv);

if (!program.config) {
	console.error("You need to provide a config file. Use --help parameter for further information.");
	process.exit(1);
}

let config;

try {
	const where = isAbsolute(program.config) ? program.config : resolve(process.cwd(), program.config);
	console.debug(where);
	config = JSON.parse(readFileSync(where, "utf-8"));
} catch (err) {
	console.error("You need to provide a valid config file. Use --help parameter for further information.");
	console.debug(err.message);
	process.exit(2);
}

const quiet = program.quiet;

const redisclient: RedisClient = createClient(config.redis);
const redispublish: RedisClient = createClient(config.redis);

let redissubscribe: RedisClient;

const supportedCommandsDescription = {
	"reload": "Reload jobs file",
	"runall": "Runs all available commands",
	"help": "Show the list of available commands",
	"?": "Help alias",
	"quit": "Exits"
};

let jobs: JobElement[] = [];
let crons = [];
let connection: Sequelize;
let mongodbclient: MongoClient;

function generator(functionname: Function, obj: any, basekey: string, params?: { [key: string]: any }) {
	return function (): Promise<void> {
		params.config = config;
		params.connection = connection;
		params.mongodbclient = mongodbclient;
		if (!params.dbname) {
			params.dbname = config.mongodb.database;
		}

		return Reflect.apply(functionname, obj, [params]).then((value: any[]) => {
			const newkey = calculateKey(basekey, params);

			console.log(newkey);
			const stringfied = JSON.stringify(value);
			redisclient.set(newkey, stringfied, print);

			redispublish.publish(newkey, stringfied);
			redispublish.publish("updates", newkey);
			if (config.debug) {
				console.log("Event OK:", newkey, "The length of the new stored value is:", stringfied.length);
			}
		}, (err) => {
			console.error(basekey, err);
		});
	};
}

function caller(functionname: Function, obj: any, key: string, parameters?: { [key: string]: string[] }) {
	return function (): Promise<void> {
		if (typeof parameters === "undefined") {
			return generator(functionname, obj, key, {})();
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

		const fns = callingparams.map((p) => generator(functionname, obj, key, p));

		return fns.reduce((p: Promise<void>, c) => p.then(() => c()), Promise.resolve());
	};
}

function runCommand(cmd: string): Promise<void> {
	const coincidences = cmd.trim() === "runall" ? jobs : jobs.filter((job) => cmd.indexOf("*") >= 0 ? GlobToRegExp(cmd).test(job.$.key) : job.$.key === cmd);

	if (coincidences.length === 0) {
		console.error("Wrong command:", cmd, "Enter help for available commands");

		return Promise.resolve();
	}

	return Promise.all(coincidences.map((job) => {
		const plugin = job.$.method.split(".");
		const obj = lib[plugin[0]];
		const functionname = lib[plugin[0]][plugin[1]];

		let parameters = null;

		if (job.parameters) {
			parameters = job.parameters[0].field.reduce((prev, parameter) => {
				prev[parameter.$.name] = parameter.value;

				return prev;
			}, {});
		}

		return caller(functionname, obj, job.$.key, parameters)();
	})).then(() => {});
}

function connectSQL(): Promise<void> {

	if (config.db.options.logging) {
		config.db.options.logging = console.log;
	}
	connection = new Sequelize(config.db.database, config.db.username, config.db.password, config.db.options);

	return connection.authenticate();
}

function connectMongo(): Promise<void> {
	const options: MongoClientOptions = config.mongodb.options ? config.mongodb.options : { useNewUrlParser: true, useUnifiedTopology: true };

	return connect(config.mongodb.url, options)
		.then((client) => { mongodbclient = client; });
}

function cancelAllCrons() {
	crons.forEach(function (c) {
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
	redissubscribe && redissubscribe.quit();

	process.exit(0);
}

function setJobs(jbs: JobList): Promise<void> {
	cancelAllCrons();

	jobs = jbs.jobs.job;
	crons = jobs.filter(function (job) {
		return job.$.cron;
	}).map(function (job) {
		const cronmatching: string = job.$.cron;
		const methodname = job.$.method.split(".");
		const obj = lib[methodname[0]];
		const functionname = typeof lib[methodname[0]][methodname[1]] === "undefined" ? false : lib[methodname[0]][methodname[1]];
		let parameters: {[id: string]: string[]} = null;

		if (!obj || !functionname) {
			console.error("Bad configuration!", methodname[0], methodname[1]);

			return false;
		}

		if (job.parameters) {
			parameters = job.parameters[0].field.reduce(function (prev, parameter) {
				prev[parameter.$.name] = parameter.value;

				return prev;
			}, {});
		}
		const fn = caller(functionname, obj, job.$.key, parameters);

		return scheduleJob(cronmatching, fn);
	}).filter((a) => a);

	return Promise.resolve();
}

const supportedCommands = {
	reload: function () {
		return loadXML(config)
			.then((content) => xml2jobs(content))
			.then((jbs) => setJobs(jbs))
			.catch((err) => {
				console.error(err);
				throw err;
			});
	},
	runall: function () {
		return Promise.all(jobs.map((job) => job.$.key).map((c) => runCommand(c)));
	},
	help: function () {
		const comms = Object.keys(supportedCommands).map(function (s) {
			return s + (typeof supportedCommandsDescription[s] === "string" ? EOL + "\t" + supportedCommandsDescription[s] : "");
		});
		const options = jobs.map(function (job) {
			return job.$.key + (job.description ? EOL + "\t" + job.description : "");
		}).concat(comms);

		console.log(EOL, "The available options are:", EOL);
		console.log(options.join(EOL));

		return Promise.resolve(true);
	},
	"?": function () {
		return supportedCommands.help();
	},
	quit: function () {
		safeexit();
	}
};

function completer(line: string) {
	const comms = Object.keys(supportedCommands);
	const options = jobs.map((job) => job.$.key).concat(comms);

	const hits = options.filter((c) => c.startsWith(line));

	return [hits.length ? hits : options, line];
}

const rl = (quiet < 0) ? readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	prompt: "COMMAND> ",
	completer: completer
}) : null;

const loadingSteps = [];

loadingSteps.push(loadXML(config));

if (config.db && config.db.enabled) {
	loadingSteps.push(connectSQL());
}

if (config.mongodb && config.mongodb.enabled) {
	loadingSteps.push(connectMongo());
}

Promise.all(loadingSteps)
	.then((content) => xml2jobs(content[0]))
	.then((jbs: JobList) => setJobs(jbs))
	.then(() => {
		rl && rl.prompt();
	}).catch((err) => {
		console.error(err);
		process.exit(-1);
	});

process.on("exit", () => {
	safeexit();
});

function runEnteredCommand(line: string) {
	if (line.trim() !== "") {
		const prefix = line.startsWith("/") ? line.substring(1).split(" ")[0] : line.split(" ")[0];

		if (typeof supportedCommands[prefix] === "function") {
			return supportedCommands[prefix](line);
		}

		return runCommand(line.trim());
	}

	return Promise.resolve(true);
}

if (rl) {
	rl.on("line", function (line) {
		runEnteredCommand(line).finally(() => {
			rl && rl.prompt();
		});
	}).on("close", function () {
		process.exit(0);
	});
}

const channels2subscribe: string[] = config.redis.channels && Array.isArray(config.redis.channels.listen) ? config.redis.channels.listen : [];

if (channels2subscribe.length > 0) {
	redissubscribe = createClient(config.redis);
	channels2subscribe.forEach((channel) => {
		redissubscribe.subscribe(channel);
	});

	redissubscribe.on("message", (channel, message) => {
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
		const app = express();
		app.get("*", function (req, res) {

			if (req.originalUrl === "/") {
				const comms = Object.keys(supportedCommands);
				const options = jobs.map((job) => job.$.key).concat(comms);

				res.json(options);
			} else {
				redisclient.get(req.originalUrl, function (err, val) {
					if (err) {
						res.status(500).json(err);
					} else if (val) {
						res.type("application/json").send(val).end();
					} else {
						res.status(404).type("application/json").send("404").end();
					}
				});
			}
		}).post("*", (req: Request, res: Response) => {
			runEnteredCommand(req.originalUrl).then(() => {
				res.json(req.originalUrl);
			}).catch((err) => {
				res.status(500).json(err);
			});
		});

		app.listen(config.server.port, config.server.bind, () => {
			console.log("Listenning on port", config.server.port);
		});
	} else {
		console.error("Cannot listen on unspecified port");
	}
}

process.on("uncaughtException", (s) => {
	console.error("uncaughtException");
	console.error(s);

	throw s;
});

process.on("SIGINT", function () {
	if (connection) {
		connection.close();
	}
	if (mongodbclient) {
		mongodbclient.close();
	}

	process.exit(0);
});

