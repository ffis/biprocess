
import { readFile } from "fs/promises";
import { resolve } from "path";

import { queryAndReturnAsPromise } from "../lib/util";
import { JobParameters } from "../types";

export interface GenericQueryParameters extends JobParameters {
    query: string;
}

export interface LoadJSONFromFileParameters extends JobParameters {
    filename: string;
}

export function genericQuery(parameters: GenericQueryParameters): Promise<any[]> {
    const query = parameters.query.trim();

    return queryAndReturnAsPromise(parameters.connection, query, parameters);
}

// TODO: I don't know if it should check if the file lays inside the biprocess directory.
export function loadJSONFromFile(parameters: LoadJSONFromFileParameters): Promise<any[]> {
    const filename = parameters.filename.trim();
    const filepath = filename.indexOf('://') >= 0 ? filename : filename[0] === '/' ? filename : resolve(__dirname, "..", "..", filename);

    return readFile(filepath, "utf-8").then((data) => JSON.parse(data));
}
