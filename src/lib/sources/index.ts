import { resolve } from "path";
import { Config } from "../../config";
import { JobElement } from "../../types";
import { XMLJobSource } from "./files";

export interface JobSource {
  loadJobs: () => Promise<JobElement[]>;
}

export function getDefaultJobSource(config: Config): JobSource {
  return new XMLJobSource({
    referenceDirectory: resolve(__dirname, "..", "..", ".."),
    jobsDirectory: config.jobsDirectory,
  });
}
