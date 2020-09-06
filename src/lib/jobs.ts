import GlobToRegExp = require("glob-to-regexp");

import { AfterFunction, DecorateFunction, Job, JobElement, Libraries, callerType, ScheduleJob, MethodKind, Library } from "../types";

export interface JobManagerOptions {
    after: AfterFunction;
    caller: callerType;
    decorate: DecorateFunction;
    libs: Libraries;
    scheduleJob: ScheduleJob;
}

export class JobManager {
    private crons: Job[];
    private jobs_: JobElement[];
    private parameters: JobManagerOptions;

    constructor(parameters: JobManagerOptions) {
        this.crons = [];
        this.jobs_ = [];
		this.parameters = Object.assign({}, parameters);
    }

    get jobs(): JobElement[] {
        return this.jobs_;
    }

    cancelAllCrons(): void {
        this.crons.forEach((c) => {
            c.cancel();
        });
        this.crons = [];
    }

    ensureLibraryAvailability(job: JobElement): void {
        const methodname = job.$.method.split(".");
        const obj = this.parameters.libs[methodname[0]];
        if (!obj) {
            throw new Error("No library called " + methodname[0] + " is available");
        }

        const functionname = typeof this.parameters.libs[methodname[0]][methodname[1]] === "undefined" ? null : this.parameters.libs[methodname[0]][methodname[1]];

        if (!obj || !functionname) {
            throw new Error("No function called " + methodname[1] + " is available on library " + methodname[0]);
        }

        if (typeof this.parameters.libs[methodname[0]][methodname[1]] !== "function") {
            throw new Error("Something called " + methodname[1] + " is available on library " + methodname[0] + " but is not a function");
        }
    }

    getLibraryMethod(job: JobElement): {library: Library, fn: MethodKind} {
        this.ensureLibraryAvailability(job);

        const methodname = job.$.method.split(".");
        const library = this.parameters.libs[methodname[0]];
        const fn = this.parameters.libs[methodname[0]][methodname[1]];

        return { library, fn };
    }

    getJobsName(job: JobElement): string {
        return job.$.key;
    }

    setJobs(jbs: JobElement[]): Promise<void> {
        this.cancelAllCrons();

        this.jobs_ = jbs;
        this.crons = this.jobs.reduce((p: Job[], job: JobElement) => {
            const name = this.getJobsName(job);

            try {
                this.ensureLibraryAvailability(job);
            } catch (err) {
                console.error(err);

                return p;
            }

            if (!job.$.cron) {
                return p;
            }
            const cronmatching: string = job.$.cron;

            const { library, fn } = this.getLibraryMethod(job);

            const parameters: {[id: string]: string[]}| null = (job.parameters) ?
                job.parameters[0].field.reduce((prev: {[s: string]: string[]}, parameter) => {
                    const idx: string = parameter.$.name.valueOf();
                    prev[idx] = parameter.value;

                    return prev;
                }, {}) : null;

            const scheduledfn = this.parameters.caller(fn, library, job.$.key, parameters, this.parameters.decorate, this.parameters.after);

            p.push(this.parameters.scheduleJob(name, cronmatching, scheduledfn));

            return p;
        }, [] as Job[]);

        return Promise.resolve();
    }

    runCommand(cmd: string): Promise<void> {
        if (this.jobs.length === 0) {
            return Promise.reject("No job has been configured");
        }

        const coincidences = cmd.trim() === "runall" ? this.jobs : this.jobs.filter((job) => cmd.indexOf("*") >= 0 ? GlobToRegExp(cmd).test(job.$.key) : job.$.key === cmd);

        if (coincidences.length === 0) {
            console.error("Wrong command:", cmd, "Enter help for available commands");

            return Promise.resolve();
        }

        return Promise.all(coincidences.map((job) => {
            try {
                this.ensureLibraryAvailability(job);
            } catch (err) {
                console.error(err);

                return Promise.resolve();
            }

            const { library, fn } = this.getLibraryMethod(job);

            let parameters = null;

            if (job.parameters) {
                parameters = job.parameters[0].field.reduce((prev: {[s: string]: any}, parameter) => {
                    prev[parameter.$.name] = parameter.value;

                    return prev;
                }, {});
            }

            return this.parameters.caller(fn, library, job.$.key, parameters, this.parameters.decorate, this.parameters.after)();
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        })).then(() => {});
}
}