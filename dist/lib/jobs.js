"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobManager = void 0;
var GlobToRegExp = require("glob-to-regexp");
var JobManager = (function () {
    function JobManager(libs, caller, decorate, after, scheduleJob) {
        this.libs = libs;
        this.caller = caller;
        this.decorate = decorate;
        this.after = after;
        this.scheduleJob = scheduleJob;
        this.crons = [];
        this.jobs_ = [];
    }
    Object.defineProperty(JobManager.prototype, "jobs", {
        get: function () {
            return this.jobs_;
        },
        enumerable: false,
        configurable: true
    });
    JobManager.prototype.cancelAllCrons = function () {
        this.crons.forEach(function (c) {
            c.cancel();
        });
        this.crons = [];
    };
    JobManager.prototype.ensureLibraryAvailability = function (job) {
        var methodname = job.$.method.split(".");
        var obj = this.libs[methodname[0]];
        if (!obj) {
            throw new Error("No library called " + methodname[0] + " is available");
        }
        var functionname = typeof this.libs[methodname[0]][methodname[1]] === "undefined" ? null : this.libs[methodname[0]][methodname[1]];
        if (!obj || !functionname) {
            throw new Error("No function called " + methodname[1] + " is available on library " + methodname[0]);
        }
        if (typeof this.libs[methodname[0]][methodname[1]] !== "function") {
            throw new Error("Something called " + methodname[1] + " is available on library " + methodname[0] + " but is not a function");
        }
    };
    JobManager.prototype.getLibraryMethod = function (job) {
        this.ensureLibraryAvailability(job);
        var methodname = job.$.method.split(".");
        var library = this.libs[methodname[0]];
        var fn = this.libs[methodname[0]][methodname[1]];
        return { library: library, fn: fn };
    };
    JobManager.prototype.getJobsName = function (job) {
        return job.$.key;
    };
    JobManager.prototype.setJobs = function (jbs) {
        var _this = this;
        this.cancelAllCrons();
        this.jobs_ = jbs.jobs.job;
        this.crons = this.jobs.reduce(function (p, job) {
            var name = _this.getJobsName(job);
            try {
                _this.ensureLibraryAvailability(job);
            }
            catch (err) {
                console.error(err);
                return p;
            }
            if (!job.$.cron) {
                return p;
            }
            var cronmatching = job.$.cron;
            var _a = _this.getLibraryMethod(job), library = _a.library, fn = _a.fn;
            var parameters = (job.parameters) ?
                job.parameters[0].field.reduce(function (prev, parameter) {
                    var idx = parameter.$.name.valueOf();
                    prev[idx] = parameter.value;
                    return prev;
                }, {}) : null;
            var scheduledfn = _this.caller(fn, library, job.$.key, parameters, _this.decorate, _this.after);
            p.push(_this.scheduleJob(name, cronmatching, scheduledfn));
            return p;
        }, []);
        return Promise.resolve();
    };
    JobManager.prototype.runCommand = function (cmd) {
        var _this = this;
        if (this.jobs.length === 0) {
            return Promise.reject("No job has been configured");
        }
        var coincidences = cmd.trim() === "runall" ? this.jobs : this.jobs.filter(function (job) { return cmd.indexOf("*") >= 0 ? GlobToRegExp(cmd).test(job.$.key) : job.$.key === cmd; });
        if (coincidences.length === 0) {
            console.error("Wrong command:", cmd, "Enter help for available commands");
            return Promise.resolve();
        }
        return Promise.all(coincidences.map(function (job) {
            try {
                _this.ensureLibraryAvailability(job);
            }
            catch (err) {
                console.error(err);
                return Promise.resolve();
            }
            var _a = _this.getLibraryMethod(job), library = _a.library, fn = _a.fn;
            var parameters = null;
            if (job.parameters) {
                parameters = job.parameters[0].field.reduce(function (prev, parameter) {
                    prev[parameter.$.name] = parameter.value;
                    return prev;
                }, {});
            }
            return _this.caller(fn, library, job.$.key, parameters, _this.decorate, _this.after)();
        })).then(function () { });
    };
    return JobManager;
}());
exports.JobManager = JobManager;
//# sourceMappingURL=jobs.js.map