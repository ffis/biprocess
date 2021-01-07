import { promisify } from "util";
import { scheduleJob } from "node-schedule";
import { createClient } from "redis";
import { connect } from "mongodb";

import { caller } from "./utils";

import { resolve } from "path";
import { readFileSync } from "fs";
import { Command } from "commander";

import { ConnectionType, MongoConnectionType } from "./types";

import { IConfig } from "./types/config";
import { connectSQL } from "./lib/connections/mssql";
import { connectMongo } from "./lib/connections/mongo";
import { JobManager } from "./lib/jobs/impl/jobmanager";
import { IJobManager } from "./lib/jobs";
import { getInterfaces } from "./lib/interfaces";

import libs from "./routes";
import { afterFnWithRedis } from "./afterfunction";
import { getDefaultJobSource } from "./lib/sources";
import {
  createClientLike,
  RedisConnectionLike,
  redisProvider,
} from "./lib/connections/redis";
import { configProvider } from "./providers/config";

const packagedescription = JSON.parse(
  readFileSync(resolve(__dirname, "..", "package.json"), "utf-8")
);

const program = new Command();

program
  .version(packagedescription.version)
  .requiredOption(
    "-c, --config <file>",
    "Sets the config file this program will use"
  )
  .option("-q, --quiet", "Disable interactive shell");

program.parse(process.argv);

if (!program.config) {
  console.error(
    "You need to provide a config file. Use --help parameter for further information."
  );
  process.exit(1);
}

const config: IConfig = configProvider(process.argv);

if (program.quiet) {
  config.quiet = true;
}

const redisclient: RedisConnectionLike = redisProvider(
  (createClient as unknown) as createClientLike,
  config.redis.url
);
const redispublish: RedisConnectionLike = redisProvider(
  (createClient as unknown) as createClientLike,
  config.redis.url
);

const redisClientGet = promisify(redisclient.get).bind(redisclient);
const redisClientSet = promisify(redisclient.set).bind(redisclient);
const redisClientPublish = promisify(redispublish.publish).bind(redispublish);

let connection: ConnectionType;
let mongodbclient: MongoConnectionType;

const jobManager: IJobManager = new JobManager({
  after: afterFnWithRedis({
    get: redisClientGet,
    set: redisClientSet,
    publish: redisClientPublish,
  }),
  decorate: decorateParametersFn,
  caller,
  libs,
  scheduleJob,
});

const interfaces = getInterfaces(config, runEnteredCommand);

function safeexit() {
  jobManager
    .cancelAllCrons()
    .then(() => Promise.all(interfaces.map((ui) => ui.close())))
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

const supportedCommands: { [s: string]: () => Promise<void> } = {
  reload: function () {
    return getDefaultJobSource(config)
      .loadJobs()
      .then((jbs) => jobManager.setJobs(jbs))
      .then(() =>
        Promise.all(
          interfaces.map((userInterface) =>
            userInterface.setJobs(jobManager.jobs)
          )
        )
      )
      .then(() =>
        Promise.all(
          interfaces.map((userInterface) =>
            userInterface.setOptions(getOptions())
          )
        )
      )
      .then(() =>
        interfaces.reduce(
          (p, userInterface) => p.then(() => userInterface.run()),
          Promise.resolve()
        )
      )
      .then(() => {})
      .catch((err) => {
        console.error(err);
        throw err;
      });
  },
  runall: function () {
    return Promise.all(
      jobManager.jobs
        .map((job) => job.$.key)
        .map((c) => jobManager.runCommand(c))
    ).then(() => {});
  },
  quit: function () {
    safeexit();

    return Promise.resolve();
  },
};

function runEnteredCommand(line: string): Promise<void> {
  if (line.trim() !== "") {
    const prefix = line.startsWith("/")
      ? line.substring(1).split(" ")[0]
      : line.split(" ")[0];

    if (typeof supportedCommands[prefix] === "function") {
      return supportedCommands[prefix]();
    }

    return jobManager.runCommand(line.trim());
  }

  return Promise.resolve();
}

const loadingSteps: Promise<void>[] = [];

if (config.db && config.db.enabled) {
  loadingSteps.push(
    connectSQL(config).then((c) => {
      connection = c;
    })
  );
}

if (config.mongodb && config.mongodb.enabled) {
  loadingSteps.push(
    connectMongo(connect, config).then((m) => {
      mongodbclient = m;
    })
  );
}

function getOptions(): string[] {
  const comms = Object.keys(supportedCommands);

  return jobManager.jobs.map((job) => job.$.key).concat(comms);
}

Promise.all(loadingSteps)
  .then(() => supportedCommands.reload())
  .catch((err) => {
    console.error(err);
    process.exit(-1);
  });

process.on("exit", () => {
  safeexit();
});

function decorateParametersFn(params: { [key: string]: any }): void {
  params.config = config;
  params.connection = connection;
  params.mongodbclient = mongodbclient;
  if (!params.dbname) {
    params.dbname = config.mongodb.database;
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
