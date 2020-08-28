"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.xml2jobs = exports.loadFromJobsFile = exports.loadFromJobsDirectory = exports.loadXML = void 0;
var fs_1 = require("fs");
var xml2js_1 = require("xml2js");
var util_1 = require("util");
var path_1 = require("path");
function loadXML(referenceDirectory, jobsDirectory) {
    if (jobsDirectory) {
        return loadFromJobsDirectory(referenceDirectory, jobsDirectory);
    }
    return loadFromJobsFile(referenceDirectory);
}
exports.loadXML = loadXML;
function loadFromJobsDirectory(referenceDirectory, jobsDirectory) {
    return fs_1.promises.readdir(path_1.resolve(referenceDirectory, jobsDirectory)).then(function (files) {
        return Promise.all(files
            .filter(function (file) { return file.endsWith(".xml"); })
            .map(function (file) {
            var filepath = path_1.resolve(referenceDirectory, jobsDirectory, file);
            return fs_1.promises.readFile(filepath, "utf8");
        }));
    }).catch(function () {
        var message = path_1.resolve(__dirname, "..", "..", jobsDirectory) + "is not readable or doesn\"t exist.";
        throw new Error(message);
    });
}
exports.loadFromJobsDirectory = loadFromJobsDirectory;
function loadFromJobsFile(referenceDirectory) {
    return fs_1.promises.readFile(path_1.resolve(referenceDirectory, "jobs.xml"), "utf8");
}
exports.loadFromJobsFile = loadFromJobsFile;
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
//# sourceMappingURL=files.js.map