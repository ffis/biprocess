import { JobElement } from "../../types";

export interface JobSource {
    loadJobs: () => Promise<JobElement[]>;
}
