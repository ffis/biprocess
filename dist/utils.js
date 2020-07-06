"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateKey = exports.xml2jobs = exports.loadXML = void 0;
var xml2js_1 = require("xml2js");
var fs_1 = require("fs");
var path_1 = require("path");
var util_1 = require("util");
function loadXML(config) {
    if (config.jobsDirectory) {
        return loadFromJobsDirectory(config);
    }
    return loadFromJobsFile();
}
exports.loadXML = loadXML;
function loadFromJobsDirectory(config) {
    return fs_1.promises.readdir(path_1.resolve(__dirname, "..", config.jobsDirectory)).then(function (files) {
        return Promise.all(files
            .filter(function (file) { return file.endsWith(".xml"); })
            .map(function (file) {
            var filepath = path_1.resolve(__dirname, "..", config.jobsDirectory, file);
            return fs_1.promises.readFile(filepath, "utf8");
        }));
    }).catch(function (err) {
        console.error(path_1.resolve(__dirname, "..", config.jobsDirectory), "is not readable or doesn\"t exist.");
        throw err;
    });
}
function loadFromJobsFile() {
    return fs_1.promises.readFile(path_1.resolve(__dirname, "..", "jobs.xml"), "utf8");
}
function xml2jobs(xml) {
    var parseXml = util_1.promisify(xml2js_1.parseString);
    if (typeof xml === "object" && Array.isArray(xml)) {
        return Promise
            .all(xml.map(function (data) { return parseXml(data); }))
            .then(function (datas) { return datas.reduce(function (p, c) {
            p.jobs.job = p.jobs.job.concat(c.jobs.job);
            return p;
        }, {
            jobs: { job: [] }
        }); });
    }
    return parseXml(xml).then(function (v) { return v; });
}
exports.xml2jobs = xml2jobs;
function calculateKey(basekey, params) {
    var newkey = basekey;
    if (typeof params === "object") {
        newkey = Object.keys(params).reduce(function (p, c) {
            return p.replace(":" + c, params[c]);
        }, newkey);
    }
    return newkey;
}
exports.calculateKey = calculateKey;
//# sourceMappingURL=utils.js.map