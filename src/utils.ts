
import { parseString } from "xml2js";
import { promises } from "fs";
import { resolve } from "path";
import { promisify } from "util";
import { JobList } from "./types";

export function loadXML(config): Promise<string | string[]> {

    if (config.jobsDirectory){
        return loadFromJobsDirectory(config);
    }

    return loadFromJobsFile();
}

function loadFromJobsDirectory(config): Promise<string[]> {
    return promises.readdir(resolve(__dirname, "..", config.jobsDirectory)).then((files) => {
        return Promise.all(
            files
                .filter((file) => file.endsWith(".xml"))
                .map((file) => {
                    const filepath = resolve(__dirname, "..", config.jobsDirectory, file);
                    return promises.readFile(filepath, "utf8");
            })
        );
    }).catch((err) => {
        console.error(resolve(__dirname, "..", config.jobsDirectory), "is not readable or doesn\"t exist.");
        throw err;
    });
}

function loadFromJobsFile(): Promise<string> {
    return promises.readFile(resolve(__dirname, "..", "jobs.xml"), "utf8");
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

export function calculateKey(basekey: string, params: { [key: string]: string }): string {
	let newkey = basekey;
	if (typeof params === "object") {
		newkey = Object.keys(params).reduce(function (p, c) {
			return p.replace(":" + c, params[c]);
		}, newkey);
	}

	return newkey;
}