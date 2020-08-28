"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadJSONFromFile = exports.genericQuery = void 0;
var fs_1 = require("fs");
var path_1 = require("path");
var util_1 = require("../lib/util");
function genericQuery(parameters) {
    var query = parameters.query.trim();
    return util_1.queryAndReturnAsPromise(parameters.connection, query, parameters);
}
exports.genericQuery = genericQuery;
function loadJSONFromFile(parameters) {
    var filename = parameters.filename.trim();
    var filepath = filename.indexOf('://') >= 0 ? filename : filename[0] === '/' ? filename : path_1.resolve(__dirname, "..", "..", filename);
    return fs_1.promises.readFile(filepath, "utf-8").then(function (data) { return JSON.parse(data); });
}
exports.loadJSONFromFile = loadJSONFromFile;
//# sourceMappingURL=util.js.map