"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var os_1 = require("os");
var redis_1 = require("redis");
var mongodb_1 = require("mongodb");
var sequelize_1 = require("sequelize");
var express = require("express");
var utils_1 = require("./utils");
var readline = require("readline");
var node_schedule_1 = require("node-schedule");
var path_1 = require("path");
var fs_1 = require("fs");
var Q = require("q"), globToRegExp = require("glob-to-regexp"), lib = require("require.all")("./routes");
var config = JSON.parse(fs_1.readFileSync(path_1.resolve(__dirname, "..", "config.json"), "utf-8"));
var redisclient = redis_1.createClient(config.redis);
var redispublish = redis_1.createClient(config.redis);
var redissubscribe;
var supportedCommandsDescription = {
    "reload": "Reload jobs file",
    "runall": "Runs all available commands",
    "help": "Show the list of available commands",
    "?": "Help alias",
    "quit": "Exits"
};
var jobs = [];
var crons = [];
var connection;
var mongodbclient;
function generator(functionname, obj, basekey, params) {
    return function () {
        params.config = config;
        params.connection = connection;
        params.mongodbclient = mongodbclient;
        if (!params.dbname) {
            params.dbname = config.mongodb.database;
        }
        return Reflect.apply(functionname, obj, [params]).then(function (value) {
            var newkey = utils_1.calculateKey(basekey, params);
            console.log(newkey);
            var stringfied = JSON.stringify(value);
            redisclient.set(newkey, stringfied, redis_1.print);
            redispublish.publish(newkey, stringfied);
            redispublish.publish("updates", newkey);
            if (config.debug) {
                console.log("Event OK:", newkey, "The length of the new stored value is:", stringfied.length);
            }
        }, function (err) {
            console.error(basekey, err);
        });
    };
}
function caller(functionname, obj, key, parameters) {
    return function () {
        if (typeof parameters === "undefined") {
            return generator(functionname, obj, key, {})();
        }
        var callingparams = [{}];
        for (var attr in parameters) {
            var possiblevalues = parameters[attr];
            var cp = [];
            do {
                var p = callingparams.shift();
                for (var value in possiblevalues) {
                    p[attr] = possiblevalues[value];
                    cp.push(JSON.parse(JSON.stringify(p)));
                }
            } while (callingparams.length);
            callingparams = cp;
        }
        var fns = callingparams.map(function (p) { return generator(functionname, obj, key, p); });
        return fns.reduce(function (p, c) { return p.then(function () { return c(); }); }, Promise.resolve());
    };
}
function runCommand(cmd) {
    var coincidences = cmd.trim() === "runall" ? jobs : jobs.filter(function (job) { return cmd.indexOf("*") >= 0 ? globToRegExp(cmd).test(job.$.key) : job.$.key === cmd; });
    if (coincidences.length === 0) {
        console.error("Wrong command:", cmd, "Enter help for available commands");
        return Promise.resolve();
    }
    return Promise.all(coincidences.map(function (job) {
        var plugin = job.$.method.split(".");
        var obj = lib[plugin[0]];
        var functionname = lib[plugin[0]][plugin[1]];
        var parameters = null;
        if (job.parameters) {
            parameters = job.parameters[0].field.reduce(function (prev, parameter) {
                prev[parameter.$.name] = parameter.value;
                return prev;
            }, {});
        }
        return caller(functionname, obj, job.$.key, parameters)();
    })).then(function () { });
}
function connectSQL() {
    if (config.db.options.logging) {
        config.db.options.logging = console.log;
    }
    connection = new sequelize_1.Sequelize(config.db.database, config.db.username, config.db.password, config.db.options);
    return connection.authenticate();
}
function connectMongo() {
    var options = config.mongodb.options ? config.mongodb.options : { useNewUrlParser: true, useUnifiedTopology: true };
    return mongodb_1.connect(config.mongodb.url, options)
        .then(function (client) { mongodbclient = client; });
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
function setJobs(jbs) {
    cancelAllCrons();
    jobs = jbs.jobs.job;
    crons = jobs.filter(function (job) {
        return job.$.cron;
    }).map(function (job) {
        var cronmatching = job.$.cron;
        var methodname = job.$.method.split(".");
        var obj = lib[methodname[0]];
        var functionname = typeof lib[methodname[0]][methodname[1]] === "undefined" ? false : lib[methodname[0]][methodname[1]];
        var parameters = null;
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
        var fn = caller(functionname, obj, job.$.key, parameters);
        return node_schedule_1.scheduleJob(cronmatching, fn);
    }).filter(function (a) { return a; });
    return Promise.resolve();
}
var supportedCommands = {
    reload: function () {
        return utils_1.loadXML(config)
            .then(function (content) { return utils_1.xml2jobs(content); })
            .then(function (jbs) { return setJobs(jbs); })
            .catch(function (err) {
            console.error(err);
            throw err;
        });
    },
    runall: function () {
        return Promise.all(jobs.map(function (job) { return job.$.key; }).map(function (c) { return runCommand(c); }));
    },
    help: function () {
        var comms = Object.keys(supportedCommands).map(function (s) {
            return s + (typeof supportedCommandsDescription[s] === "string" ? os_1.EOL + "\t" + supportedCommandsDescription[s] : "");
        });
        var options = jobs.map(function (job) {
            return job.$.key + (job.description ? os_1.EOL + "\t" + job.description : "");
        }).concat(comms);
        console.log(os_1.EOL, "The available options are:", os_1.EOL);
        console.log(options.join(os_1.EOL));
        return Promise.resolve(true);
    },
    "?": function () {
        return supportedCommands.help();
    },
    quit: function () {
        safeexit();
    }
};
function completer(line) {
    var comms = Object.keys(supportedCommands);
    var options = jobs.map(function (job) { return job.$.key; }).concat(comms);
    var hits = options.filter(function (c) { return c.startsWith(line); });
    return [hits.length ? hits : options, line];
}
var rl = (process.argv.indexOf("-q") < 0) ? readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "COMMAND> ",
    completer: completer
}) : false;
var loadingSteps = [];
loadingSteps.push(utils_1.loadXML(config));
if (config.db && config.db.enabled) {
    loadingSteps.push(connectSQL());
}
if (config.mongodb && config.mongodb.enabled) {
    loadingSteps.push(connectMongo());
}
Promise.all(loadingSteps)
    .then(function (content) { return utils_1.xml2jobs(content[0]); })
    .then(function (jbs) { return setJobs(jbs); })
    .then(function () {
    rl && rl.prompt();
}).catch(function (err) {
    console.error(err);
    process.exit(-1);
});
process.on("exit", function () {
    safeexit();
});
function runEnteredCommand(line) {
    if (line.trim() !== "") {
        var prefix = line.startsWith("/") ? line.substring(1).split(" ")[0] : line.split(" ")[0];
        if (typeof supportedCommands[prefix] === "function") {
            return supportedCommands[prefix](line);
        }
        return runCommand(line.trim());
    }
    return Promise.resolve(true);
}
if (rl) {
    rl.on("line", function (line) {
        runEnteredCommand(line).finally(function () {
            rl.prompt();
        });
    }).on("close", function () {
        process.exit(0);
    });
}
var channels2subscribe = config.redis.channels && Array.isArray(config.redis.channels.listen) ? config.redis.channels.listen : [];
if (channels2subscribe.length > 0) {
    redissubscribe = redis_1.createClient(config.redis);
    channels2subscribe.forEach(function (channel) {
        redissubscribe.subscribe(channel);
    });
    redissubscribe.on("message", function (channel, message) {
        if (jobs && Array.isArray(jobs)) {
            var triggeredJobs = jobs.filter(function (j) { return j.triggers && j.triggers.filter(function (trigger) { return trigger.on.filter(function (event) { return event.$.action === channel && message.includes(event.$.contains); }).length > 0; }).length > 0; });
            triggeredJobs.forEach(function (job) {
                runCommand(job.$.key);
            });
        }
    });
}
if (config.server && config.server.enabled) {
    if (config.server.port) {
        var app = express();
        app.get("*", function (req, res) {
            if (req.originalUrl === "/") {
                var comms = Object.keys(supportedCommands);
                var options = jobs.map(function (job) { return job.$.key; }).concat(comms);
                res.json(options);
            }
            else {
                redisclient.get(req.originalUrl, function (err, val) {
                    if (err) {
                        res.status(500).json(err);
                    }
                    else if (val) {
                        res.type("application/json").send(val).end();
                    }
                    else {
                        res.status(404).type("application/json").send("404").end();
                    }
                });
            }
        }).post("*", function (req, res) {
            runEnteredCommand(req.originalUrl).then(function () {
                res.json(req.originalUrl);
            }).catch(function (err) {
                res.status(500).json(err);
            });
        });
        app.listen(config.server.port, config.server.bind, function () {
            console.log("Listenning on port", config.server.port);
        });
    }
    else {
        console.error("Cannot listen on unspecified port");
    }
}
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