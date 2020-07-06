
import { promises } from "fs";

const fs = require('fs'),
    path = require('path'),
    Q = require('q');

import { queryAndReturnAsPromise } from "../lib/util";

export function genericQuery(parameters): Promise<any[]> {
    const query = parameters.query.trim();

    return queryAndReturnAsPromise(parameters.connection, query, parameters);
}

// TODO: I don't know if it should check if the file lays inside the biprocess directory.
export function loadJSONFromFile(parameters): Promise<any[]> {
    const filename = parameters.filename.trim();
    const filepath = filename.indexOf('://') >= 0 ? filename : filename[0] === '/' ? filename : path.resolve(__dirname, "..", "..", filename);

    return promises.readFile(filepath, "utf-8").then((data) => JSON.parse(data));
}
