import { MongoClientOptions } from "mongodb";
import { readFileSync } from "fs";
import { isAbsolute, resolve } from "path";

export interface DbConfig {
    "enabled": boolean;
    "database": string;
    "username": string;
    "password": string;
    "options": {
        "dialect": "mysql" | "postgres" | "sqlite" | "mariadb" | "mssql" | undefined;
        "host": string;
        "logging": boolean;
        "debug": boolean;
        "dialectOptions": {
            "encrypt": boolean;
            "options": {
                "enableArithAbort": boolean;
                "trustServerCertificate": boolean;
            }
        }
    }
}

export interface MongoDBConfig {
    "enabled": boolean;
    "url": string;
    "database": string;
    "options": MongoClientOptions;
}

export interface RedisConfig {
    "host": string;
    "port"?: number;
    "password"?: string;
    "no_ready_check": boolean;
    "channels": {
        "listen": string[];
    }
}

export interface ServerConfig {
    "enabled": boolean;
    "port": number;
    "bind": string;
}

export interface Config {
    "db": DbConfig;
    "mongodb": MongoDBConfig;
    "redis": RedisConfig;
    "debug": boolean;
    "jobsDirectory": string;
    "server": ServerConfig;
    "quiet"?: boolean;
}

export function getConfig(configfile: string): Config {
    try {

        const where = isAbsolute(configfile) ?
            configfile :
            resolve(process.cwd(), configfile);

        return JSON.parse(readFileSync(where, "utf-8"));

    } catch (err) {
        const message = "You need to provide a valid config file. Use --help parameter for further information.";
        throw new Error(message);
    }
}