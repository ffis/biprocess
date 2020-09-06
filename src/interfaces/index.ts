import { createClient } from "redis";

import { Config } from "../config";
import { HTTPInterface } from "./http";
import { JobElement } from "../types";
import { RedisChannelInterface } from "./redischannel";
import { ReadLineInterface } from "./readline";

export enum AvailableCommands {
    help = "help"
}

export const supportedCommandsDescription: {[s: string]: string} = {
	"reload": "Reload jobs file",
	"runall": "Runs all available commands",
	"help": "Show the list of available commands",
	"quit": "Exits"
};

export interface BiprocessInterface {
    close: () => Promise<void>;
    run: () => Promise<void>;
    setOptions: (options: string[]) => void;
    setJobs: (jobs: JobElement[]) => void;
}

export function getInterfaces(config: Config, runEnteredCommand: (s: string) => Promise<void>): BiprocessInterface[] {
    const interfaces: BiprocessInterface[] = [];

    if (config.server && config.server.enabled) {
        /* TODO: design and implement this */
        const retrieveFn = (_s: string) => Promise.resolve("");

        const httpinterface = new HTTPInterface({ config: config.server, runEnteredCommand, retrieveFromKey: retrieveFn });
        interfaces.push(httpinterface);
    }

    if (!config.quiet) {
        const readLineInterface = new ReadLineInterface({ runEnteredCommand });
        interfaces.push(readLineInterface);
    }

    const channels2subscribe: string[] = config.redis.channels && Array.isArray(config.redis.channels.listen) ? config.redis.channels.listen : [];
    if (channels2subscribe.length > 0) {
        const redisChannelInterface = new RedisChannelInterface({ config: config.redis, createClient, runEnteredCommand });

        interfaces.push(redisChannelInterface);
    }

    return interfaces;
}

