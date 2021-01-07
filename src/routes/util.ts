import { QueryTypes } from "sequelize";
import { promises as fs } from "fs";
import { resolve } from "path";

import { ConnectionType, JobParameters } from "../types";

export interface GenericQueryParameters extends JobParameters {
  query: string;
}

export interface LoadJSONFromFileParameters extends JobParameters {
  filename: string;
}

export function genericQuery(
  parameters: GenericQueryParameters
): Promise<unknown[]> {
  const query = parameters.query.trim();

  return queryAndReturnAsPromise(parameters.connection, query, parameters);
}

// TODO: I don't know if it should check if the file lays inside the biprocess directory.
export function loadJSONFromFile(
  parameters: LoadJSONFromFileParameters
): Promise<unknown[]> {
  const filename = parameters.filename.trim();
  const filepath =
    filename.indexOf("://") >= 0
      ? filename
      : filename[0] === "/"
      ? filename
      : resolve(__dirname, "..", "..", filename);

  return fs.readFile(filepath, "utf-8").then((data) => JSON.parse(data));
}

function queryAndReturnAsPromise(
  connection: ConnectionType,
  query: string,
  parameters: GenericQueryParameters
): Promise<unknown[]> {
  const pms = {
    bind:
      Object.keys(parameters).length > 1
        ? Object.assign({}, parameters, { query: null })
        : undefined,
    type: QueryTypes.SELECT,
  };

  return connection.query(query, pms);
}
