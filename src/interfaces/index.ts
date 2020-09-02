import { Config } from "../config";
import { HTTPInterface } from "./http";
import { JobElement } from "../types";
import { RedisChannelInterface } from "./redischannel";
import { ReadLineInterface } from "./readline";

export interface BiprocessInterface {
    close: () => Promise<void>;
    run: () => Promise<void>;
    setOptions: (options: string[]) => void;
    setJobs: (jobs: JobElement[]) => void;
}

export function runInterfaces(config: Config, runEnteredCommand: (s: string) => Promise<void>): BiprocessInterface[] {
    const interfaces: BiprocessInterface[] = [];

    if (config.server && config.server.enabled) {
        const retrieveFn = (_s: string) => {
            return Promise.resolve("");
        }
        const httpinterface = new HTTPInterface({ config: config.server, runEnteredCommand, retrieveFromKey: retrieveFn });
        interfaces.push(httpinterface);
    }

    if (!config.quiet) {
        const readLineInterface = new ReadLineInterface(runEnteredCommand);
        interfaces.push(readLineInterface);
    }

    const channels2subscribe: string[] = config.redis.channels && Array.isArray(config.redis.channels.listen) ? config.redis.channels.listen : [];
    if (channels2subscribe.length > 0) {
        const redisChannelInterface = new RedisChannelInterface(config.redis, runEnteredCommand);

        interfaces.push(redisChannelInterface);
    }

    return interfaces;
}

