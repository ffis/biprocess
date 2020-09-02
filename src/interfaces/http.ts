import { Express, Request, Response, Router } from "express";
import express = require("express");

import { BiprocessInterface } from ".";
import { Server } from "http";

import { ServerConfig } from "../config";
import { ok } from "assert";
import { Logger } from "../types";

export interface HTTPInterfaceOptions {
    config: ServerConfig;
    runEnteredCommand: (s: string) => Promise<void>;
    retrieveFromKey: (s: string) => Promise<string>;
    logger?: Logger;
}

export class HTTPInterface implements BiprocessInterface {
    private app_: Express | null;
    private router: Router;
    private server: Server | null;
    private options: string[];
    private parameters: HTTPInterfaceOptions;

    constructor(parameters: HTTPInterfaceOptions) {
        this.app_ = null;
        this.server = null;

        ok(parameters.config, "Config is mandatory");
        ok(parameters.runEnteredCommand, "runEnteredCommand is mandatory");
        ok(parameters.retrieveFromKey, "retrieveFromKey is mandatory");
        ok(parameters.config.port, "There must be a port configured");
        ok(parameters.config.bind, "There must be a bind address configured");

        this.parameters = Object.assign({}, parameters);
        if (!this.parameters.logger) {
            this.parameters.logger = console;
        }

        this.router = Router();
        this.router.get("*", (req: Request, res: Response) => {
    
            if (req.originalUrl === "/") {
                res.json(this.options);
            } else {
                this.parameters.retrieveFromKey(req.originalUrl).then((val) => {
                    if (val) {
                        res.type("application/json").send(val).end();
                    } else {
                        res.status(404).type("application/json").send("404").end();
                    }
                }).catch((err) => {
                    this.parameters.logger!.error(err);
                    res.status(500).end();
                });
            }
        }).post("*", (req: Request, res: Response) => {
            this.parameters.runEnteredCommand(req.originalUrl).then(() => {
                res.json(req.originalUrl);
            }).catch((err: Error) => {
                this.parameters.logger!.error(err);
                res.status(500).end();
            });
        });
        this.options = [];
    }

    get app(): Express {
        return this.app_!;
    }

    setOptions(options: string[]): void {
        this.options = options;
    }

    setJobs(): void {}

    run(): Promise<void> {
        if (this.app_ && this.server) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            this.app_ = express();
            this.app_.use(this.router);
            this.server = this.app_.listen(this.parameters.config.port, this.parameters.config.bind, () => {
                this.parameters.logger!.log("Listenning on port", this.parameters.config.port);
                resolve();
            });
            this.server.on("error", () => {
                reject("Error trying to listen on port " + this.parameters.config.port);
            });
        });
    }

    close(): Promise<void> {
        if (this.server) {
            const server = this.server;
            this.server = null;
            this.app_ = null;

            return new Promise((resolve, reject) => {
                server.close((err) => {
                    if (err) { reject(err); } else { resolve(); }
                });
            });
        }

        return Promise.resolve();
    }
}
