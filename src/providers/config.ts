import { resolve } from "path";
import { ParsedArgs } from "minimist";
import minimist from "minimist";

import { readJSONFileSync } from "../services/jsonfilereader";
import { IConfig } from "../types/config";

export function configProvider(argv = process.argv): IConfig {
  const parsedArgv: ParsedArgs = minimist(argv.slice(2));

  const isJasmine = argv[1].includes("jasmine");

  const configfile: string =
    !isJasmine && typeof parsedArgv.config === "string"
      ? parsedArgv.config.startsWith("/")
        ? parsedArgv.config
        : resolve(process.cwd(), parsedArgv.config)
      : resolve(__dirname, "..", "config.json");

  return readJSONFileSync<IConfig>(configfile);
}
