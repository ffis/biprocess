"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadJSONFromFile = exports.genericQuery = void 0;
var fs_1 = require("fs");
var fs = require('fs'), path = require('path'), Q = require('q');
var util_1 = require("../lib/util");
function genericQuery(parameters) {
    var query = parameters.query.trim();
    return util_1.queryAndReturnAsPromise(parameters.connection, query, parameters);
}
exports.genericQuery = genericQuery;
// TODO: I don't know if it should check if the file lays inside the biprocess directory.
function loadJSONFromFile(parameters) {
    var filename = parameters.filename.trim();
    var filepath = filename.indexOf('://') >= 0 ? filename : filename[0] === '/' ? filename : path.resolve(__dirname, "..", "..", filename);
    return fs_1.promises.readFile(filepath, "utf-8").then(function (data) { return JSON.parse(data); });
}
exports.loadJSONFromFile = loadJSONFromFile;
//# sourceMappingURL=util.js.map