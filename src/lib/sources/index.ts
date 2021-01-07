import { resolve } from "path";
import { IConfig } from "../../types/config";
import { JobElement } from "../../types";
import { XMLJobSource } from "./files";

export interface JobSource {
  loadJobs: () => Promise<JobElement[]>;
}

export function getDefaultJobSource(config: IConfig): JobSource {
  return new XMLJobSource({
    referenceDirectory: resolve(__dirname, "..", "..", ".."),
    jobsDirectory: config.jobsDirectory,
  });
}
