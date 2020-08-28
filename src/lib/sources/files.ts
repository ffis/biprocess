import { promises as fs } from "fs";

import { parseString } from "xml2js";
import { promisify } from "util";
import { resolve } from "path";
import { JobList } from "../../types";

export function loadXML(referenceDirectory: string, jobsDirectory?: string): Promise<string | string[]> {

    if (jobsDirectory){
        return loadFromJobsDirectory(referenceDirectory, jobsDirectory);
    }

    return loadFromJobsFile(referenceDirectory);
}

export function loadFromJobsDirectory(referenceDirectory: string, jobsDirectory: string): Promise<string[]> {
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
        const message = resolve(__dirname, "..", "..", jobsDirectory) + "is not readable or doesn\"t exist.";
        throw new Error(message);
    });
}

export function loadFromJobsFile(referenceDirectory: string): Promise<string> {
    return fs.readFile(resolve(referenceDirectory, "jobs.xml"), "utf8");
}

export function xml2jobs(xml: string | string[]): Promise<JobList> {
    const parseXml = promisify(parseString);

    if (typeof xml === "object" && Array.isArray(xml)) {
        return Promise
            .all(xml.map((data) => parseXml(data) as unknown as JobList) )
            .then((datas: JobList[]) => datas.reduce((p: JobList, c: JobList) => {
                p.jobs.job = p.jobs.job.concat(c.jobs.job);

                return p;
            }, {
                jobs: {job: []}
            })
        );
    }

    return parseXml(xml).then((v) => v as JobList);
}