
import { BiprocessInterface } from ".";
import { createClient, RedisClient } from "redis";
import { RedisConfig } from "../config";
import { ok } from "assert";
import { JobElement } from "../types";


export class RedisChannelInterface implements BiprocessInterface {
    private jobs: JobElement[];
    private redissubscribe: RedisClient | null;

    constructor(private config: RedisConfig, private runEnteredCommand: (s: string) => Promise<void>) {
        ok(config.channels);
        ok( Array.isArray(config.channels.listen));
        this.redissubscribe = null;
        this.jobs = [];
    }

    setOptions(): void {}

    setJobs(jobs: JobElement[]) {
        this.jobs = jobs;
    }

    run(): Promise<void> {

        this.redissubscribe = createClient(this.config);
        this.config.channels.listen.forEach((channel) => {
            this.redissubscribe!.subscribe(channel);
        });

        this.redissubscribe.on("message", (channel: string, message: string) => {
            if (this.jobs && Array.isArray(this.jobs)) {
                const triggeredJobs = this.jobs.filter((j) => j.triggers && j.triggers.filter((trigger) => trigger.on.filter((event) => event.$.action === channel && message.includes(event.$.contains)).length > 0).length > 0);

                
                triggeredJobs.forEach((job) => {
                    this.runEnteredCommand(job.$.key);
                });
            }
        });

        return Promise.resolve();
    }

    close(): Promise<void> {
        if (!this.redissubscribe) {
            return Promise.resolve();
        }

        const client = this.redissubscribe;
        this.redissubscribe = null;
        client.end();

        return Promise.resolve();
    }
}