"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.afterFunctionFn = exports.decorateParametersFn = exports.getOptions = void 0;
var node_schedule_1 = require("node-schedule");
var redis_1 = require("redis");
var utils_1 = require("./utils");
var path_1 = require("path");
var fs_1 = require("fs");
var commander_1 = require("commander");
var config_1 = require("./config");
var connections_1 = require("./lib/connections");
var jobs_1 = require("./lib/jobs");
var interfaces_1 = require("./interfaces");
var files_1 = require("./lib/sources/files");
var libs = require("require.all")("./routes");
var packagedescription = JSON.parse(fs_1.readFileSync(path_1.resolve(__dirname, "..", "package.json"), "utf-8"));
var program = new commander_1.Command();
program
    .version(packagedescription.version)
    .requiredOption("-c, --config <file>", "Sets the config file this program will use")
    .option("-q, --quiet", "Disable interactive shell");
program.parse(process.argv);
if (!program.config) {
    console.error("You need to provide a config file. Use --help parameter for further information.");
    process.exit(1);
}
var config = config_1.getConfig(program.config);
if (program.quiet) {
    config.quiet = true;
}
var redisclient = redis_1.createClient(config.redis);
var redispublish = redis_1.createClient(config.redis);
var connection;
var mongodbclient;
var jobManager = new jobs_1.JobManager({
    after: afterFunctionFn,
    decorate: decorateParametersFn,
    caller: utils_1.caller,
    libs: libs,
    scheduleJob: node_schedule_1.scheduleJob
});
var interfaces = interfaces_1.getInterfaces(config, runEnteredCommand);
function safeexit() {
    jobManager.cancelAllCrons();
    Promise
        .all(interfaces.map(function (ui) { return ui.close(); }))
        .finally(function () {
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
var supportedCommands = {
    reload: function () {
        var source = new files_1.XMLJobSource({
            referenceDirectory: path_1.resolve(__dirname, ".."),
            jobsDirectory: config.jobsDirectory
        });
        return source.loadJobs()
            .then(function (jbs) { return jobManager.setJobs(jbs); })
            .then(function () { return Promise.all(interfaces.map(function (userInterface) { return userInterface.setJobs(jobManager.jobs); })); })
            .then(function () { return Promise.all(interfaces.map(function (userInterface) { return userInterface.setOptions(getOptions()); })); })
            .then(function () { })
            .catch(function (err) {
            console.error(err);
            throw err;
        });
    },
    runall: function () {
        return Promise.all(jobManager.jobs.map(function (job) { return job.$.key; }).map(function (c) { return jobManager.runCommand(c); })).then(function () { });
    },
    quit: function () {
        safeexit();
        return Promise.resolve();
    }
};
function runEnteredCommand(line) {
    if (line.trim() !== "") {
        var prefix = line.startsWith("/") ? line.substring(1).split(" ")[0] : line.split(" ")[0];
        if (typeof supportedCommands[prefix] === "function") {
            return supportedCommands[prefix]();
        }
        return jobManager.runCommand(line.trim());
    }
    return Promise.resolve();
}
var loadingSteps = [];
if (config.db && config.db.enabled) {
    loadingSteps.push(connections_1.connectSQL(config).then(function (c) {
        connection = c;
    }));
}
if (config.mongodb && config.mongodb.enabled) {
    loadingSteps.push(connections_1.connectMongo(config).then(function (m) {
        mongodbclient = m;
    }));
}
function getOptions() {
    var comms = Object.keys(supportedCommands);
    return jobManager.jobs.map(function (job) { return job.$.key; }).concat(comms);
}
exports.getOptions = getOptions;
var source = new files_1.XMLJobSource({
    referenceDirectory: path_1.resolve(__dirname, ".."),
    jobsDirectory: config.jobsDirectory
});
Promise.all(loadingSteps)
    .then(function () { return source.loadJobs(); })
    .then(function (jbs) { return jobManager.setJobs(jbs); })
    .then(function () { return Promise.all(interfaces.map(function (userInterface) { return userInterface.setJobs(jobManager.jobs); })); })
    .then(function () { return Promise.all(interfaces.map(function (userInterface) { return userInterface.setOptions(getOptions()); })); })
    .then(function () { return interfaces.reduce(function (p, userInterface) { return p.then(function () { return userInterface.run(); }); }, Promise.resolve()); })
    .catch(function (err) {
    console.error(err);
    process.exit(-1);
});
process.on("exit", function () {
    safeexit();
});
function decorateParametersFn(params) {
    params.config = config;
    params.connection = connection;
    params.mongodbclient = mongodbclient;
    if (!params.dbname) {
        params.dbname = config.mongodb.database;
    }
}
exports.decorateParametersFn = decorateParametersFn;
function afterFunctionFn(value, newkey) {
    console.log(newkey);
    var stringfied = JSON.stringify(value);
    redisclient.set(newkey, stringfied, print);
    redispublish.publish(newkey, stringfied);
    redispublish.publish("updates", newkey);
    if (config.debug) {
        console.log("Event OK:", newkey, "The length of the new stored value is:", stringfied.length);
    }
}
exports.afterFunctionFn = afterFunctionFn;
process.on("uncaughtException", function (s) {
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
//# sourceMappingURL=index.js.map