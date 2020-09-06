import { scheduleJob } from "node-schedule";
import { createClient, RedisClient } from "redis";

import { MongoClient } from "mongodb";

import { caller } from "./utils";

import { resolve } from "path";
import { readFileSync } from "fs";
import { Command } from "commander";

import { ConnectionType, Libraries } from "./types";

import { Config, getConfig } from "./config";
import { connectSQL, connectMongo } from "./lib/connections";
import { JobManager } from "./lib/jobs";
import { getInterfaces } from "./interfaces";
import { XMLJobSource } from "./lib/sources/files";

const libs: Libraries = require("require.all")("./routes");

const packagedescription = JSON.parse(readFileSync(resolve(__dirname, "..", "package.json"), "utf-8"));

const program = new Command();

program
	.version(packagedescription.version)
	.requiredOption("-c, --config <file>", "Sets the config file this program will use")
	.option("-q, --quiet", "Disable interactive shell");

program.parse(process.argv);

if (!program.config) {
	console.error("You need to provide a config file. Use --help parameter for further information.");
	process.exit(1);
}


const config: Config = getConfig(program.config);

if (program.quiet) {
	config.quiet = true;
}

const redisclient: RedisClient = createClient(config.redis);
const redispublish: RedisClient = createClient(config.redis);

let connection: ConnectionType;
let mongodbclient: MongoClient;

const jobManager = new JobManager({
	after: afterFunctionFn,
	decorate: decorateParametersFn,
	caller,
	libs,
	scheduleJob
});

const interfaces = getInterfaces(config, runEnteredCommand);

function safeexit() {
	jobManager.cancelAllCrons();

	Promise
		.all(interfaces.map((ui) => ui.close()))
		.finally(() => {
			if (connection) {
				connection.close();
			}
			if (mongodbclient) {
				mongodbclient.close();
			}
			redisclient.quit();
			redispublish.quit();

			process.exit(0);
		});
}

const supportedCommands: {[s: string]: () => Promise<void>} = {
	reload: function () {
		const source = new XMLJobSource({
			referenceDirectory: resolve(__dirname, ".."),
			jobsDirectory: config.jobsDirectory
		});

		return source.loadJobs()
			.then((jbs) => jobManager.setJobs(jbs))
			.then(() => Promise.all(interfaces.map((userInterface) => userInterface.setJobs(jobManager.jobs))))
			.then(() => Promise.all(interfaces.map((userInterface) => userInterface.setOptions(getOptions()))))
			.then(() => {})
			.catch((err) => {
				console.error(err);
				throw err;
			});
	},
	runall: function () {
		return Promise.all(jobManager.jobs.map((job) => job.$.key).map((c) => jobManager.runCommand(c))).then(() => {});
	},
	quit: function () {
		safeexit();

		return Promise.resolve();
	}
};

function runEnteredCommand(line: string): Promise<void> {
	if (line.trim() !== "") {
		const prefix = line.startsWith("/") ? line.substring(1).split(" ")[0] : line.split(" ")[0];

		if (typeof supportedCommands[prefix] === "function") {
			return supportedCommands[prefix]();
		}

		return jobManager.runCommand(line.trim());
	}

	return Promise.resolve();
}


const loadingSteps: Promise<void>[] = [];

if (config.db && config.db.enabled) {
	loadingSteps.push(connectSQL(config).then((c) => {
		connection = c;
	}));
}

if (config.mongodb && config.mongodb.enabled) {
	loadingSteps.push(connectMongo(config).then((m) => {
		mongodbclient = m;
	}));
}

export function getOptions(): string[] {
	const comms = Object.keys(supportedCommands);

	return jobManager.jobs.map((job) => job.$.key).concat(comms);
}

const source = new XMLJobSource({
	referenceDirectory: resolve(__dirname, ".."),
	jobsDirectory: config.jobsDirectory
});

Promise.all(loadingSteps)
	.then(() => source.loadJobs())
	.then((jbs) => jobManager.setJobs(jbs))
	.then(() => Promise.all(interfaces.map((userInterface) => userInterface.setJobs(jobManager.jobs))))
	.then(() => Promise.all(interfaces.map((userInterface) => userInterface.setOptions(getOptions()))))
	.then(() => interfaces.reduce((p, userInterface) => p.then(() => userInterface.run()), Promise.resolve()))
	.catch((err) => {
		console.error(err);
		process.exit(-1);
	});

process.on("exit", () => {
	safeexit();
});


export function decorateParametersFn(params: {[key: string]: any}): void {
	params.config = config;
	params.connection = connection;
	params.mongodbclient = mongodbclient;
	if (!params.dbname) {
		params.dbname = config.mongodb.database;
	}
}

export function afterFunctionFn(value: any[], newkey: string): void {
	console.log(newkey);
	const stringfied = JSON.stringify(value);
	redisclient.set(newkey, stringfied, print);

	redispublish.publish(newkey, stringfied);
	redispublish.publish("updates", newkey);
	if (config.debug) {
		console.log("Event OK:", newkey, "The length of the new stored value is:", stringfied.length);
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

