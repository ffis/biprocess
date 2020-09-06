"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runInterfaces = exports.supportedCommandsDescription = exports.AvailableCommands = void 0;
var redis_1 = require("redis");
var http_1 = require("./http");
var redischannel_1 = require("./redischannel");
var readline_1 = require("./readline");
var AvailableCommands;
(function (AvailableCommands) {
    AvailableCommands["help"] = "help";
})(AvailableCommands = exports.AvailableCommands || (exports.AvailableCommands = {}));
exports.supportedCommandsDescription = {
    "reload": "Reload jobs file",
    "runall": "Runs all available commands",
    "help": "Show the list of available commands",
    "quit": "Exits"
};
function runInterfaces(config, runEnteredCommand) {
    var interfaces = [];
    if (config.server && config.server.enabled) {
        var retrieveFn = function (_s) {
            return Promise.resolve("");
        };
        var httpinterface = new http_1.HTTPInterface({ config: config.server, runEnteredCommand: runEnteredCommand, retrieveFromKey: retrieveFn });
        interfaces.push(httpinterface);
    }
    if (!config.quiet) {
        var readLineInterface = new readline_1.ReadLineInterface({ runEnteredCommand: runEnteredCommand });
        interfaces.push(readLineInterface);
    }
    var channels2subscribe = config.redis.channels && Array.isArray(config.redis.channels.listen) ? config.redis.channels.listen : [];
    if (channels2subscribe.length > 0) {
        var redisChannelInterface = new redischannel_1.RedisChannelInterface({ config: config.redis, createClient: redis_1.createClient, runEnteredCommand: runEnteredCommand });
        interfaces.push(redisChannelInterface);
    }
    return interfaces;
}
exports.runInterfaces = runInterfaces;
//# sourceMappingURL=index.js.map