
import { BiprocessInterface } from ".";
import { RedisConfig } from "../config";
import { ok } from "assert";
import { JobElement } from "../types";

export interface Subscribable {
    unsubscribe: () => void;
    subscribe: (name: string) => void;
    on: (event: string, callback: (channel: string, message: string) => void) => void;
    quit: () => void;
}

export interface RedisChannelInterfaceOptions {
    config: RedisConfig;
    runEnteredCommand: (s: string) => Promise<void>;
    createClient: (config: RedisConfig) => Subscribable;
}

export class RedisChannelInterface implements BiprocessInterface {
    private jobs: JobElement[];
    private redissubscribe: Subscribable | null;
    private parameters: RedisChannelInterfaceOptions;

    constructor(parameters: RedisChannelInterfaceOptions) {
        ok(parameters.config.channels);
        ok(Array.isArray(parameters.config.channels.listen));
        this.redissubscribe = null;
        this.jobs = [];
		this.parameters = Object.assign({}, parameters);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    setOptions(_options: string[]): void {}

    setJobs(jobs: JobElement[]): void {
        ok(Array.isArray(jobs));
        this.jobs = jobs;
    }

    run(): Promise<void> {
        if (this.redissubscribe) {
            return Promise.resolve();
        }

        this.redissubscribe = this.parameters.createClient(this.parameters.config);
        this.parameters.config.channels.listen.forEach((channel) => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.redissubscribe!.subscribe(channel);
        });

        this.redissubscribe.on("message", (channel: string, message: string) => {
            const triggeredJobs = this.jobs.filter((j) =>
                j.triggers && j.triggers.filter((trigger) =>
                    trigger.on.filter((event) =>
                        event.$.action === channel && message.includes(event.$.contains)).length > 0).length > 0);

            triggeredJobs.forEach((job) => {
                this.parameters
                    .runEnteredCommand(job.$.key)
                    .catch((err) => {
                        console.error(err);
                    });
            });
        });

        return Promise.resolve();
    }

    close(): Promise<void> {
        if (!this.redissubscribe) {
            return Promise.resolve();
        }

        const client = this.redissubscribe;
        this.redissubscribe = null;
        client.unsubscribe();
        client.quit();

        return Promise.resolve();
    }
}