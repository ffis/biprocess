"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = void 0;
var fs_1 = require("fs");
var path_1 = require("path");
function getConfig(configfile) {
    try {
        var where = path_1.isAbsolute(configfile) ? configfile : path_1.resolve(process.cwd(), configfile);
        return JSON.parse(fs_1.readFileSync(where, "utf-8"));
    }
    catch (err) {
        var message = "You need to provide a valid config file. Use --help parameter for further information.";
        throw new Error(message);
    }
}
exports.getConfig = getConfig;
//# sourceMappingURL=config.js.map