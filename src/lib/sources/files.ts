import { promises as fs } from "fs";

import { parseString } from "xml2js";
import { promisify } from "util";
import { resolve } from "path";
import { JobList, JobElement } from "../../types";
import { JobSource } from ".";

interface XMLJobSourceOptions {
    referenceDirectory: string;
    jobsDirectory?: string;
}

export class XMLJobSource implements JobSource {
    private parameters: XMLJobSourceOptions;

    constructor(parameters: XMLJobSourceOptions) {
        this.parameters = Object.assign({}, parameters);
    }

    loadJobs(): Promise<JobElement[]> {

        return this.loadXML(this.parameters.referenceDirectory, this.parameters.jobsDirectory)
            .then((value) => this.xml2jobs(value))
            .then((joblist: JobList) => joblist.jobs.job);
    }


    private loadXML(referenceDirectory: string, jobsDirectory?: string): Promise<string | string[]> {

        if (jobsDirectory) {
            return this.loadFromJobsDirectory(referenceDirectory, jobsDirectory);
        }

        return this.loadFromJobsFile(referenceDirectory);
    }


    private loadFromJobsDirectory(referenceDirectory: string, jobsDirectory: string): Promise<string[]> {
        return fs.readdir(resolve(referenceDirectory, jobsDirectory)).then((files) => {
            return Promise.all(
                files
                    .filter((file) => file.endsWith(".xml"))
                    .map((file) => {
                        const filepath = resolve(referenceDirectory, jobsDirectory, file);
    
                        return fs.readFile(filepath, "utf8");
                })
            );
        }).catch(() => {
            const message = resolve(__dirname, "..", "..", jobsDirectory) + " is not readable or doesn\"t exist.";
            throw new Error(message);
        });
    }
    
    private loadFromJobsFile(referenceDirectory: string): Promise<string> {
        return fs.readFile(resolve(referenceDirectory, "jobs.xml"), "utf8");
    }

    private xml2jobs(xml: string | string[]): Promise<JobList> {
        const parseXml = promisify(parseString);
    
        if (typeof xml === "object" && Array.isArray(xml)) {
            return Promise
                .all(xml.map((data) => parseXml(data) as unknown as JobList))
                .then((datas: JobList[]) => 
                    datas.reduce((p: JobList, c: JobList) => {
                        p.jobs.job = p.jobs.job.concat(c.jobs.job);
    
                        return p;
                    }, {
                        jobs: {job: []}
                    })
                );
        }
    
        return parseXml(xml).then((v) => v as JobList);
    }
}
