import { Express, Request, Response, Router } from "express";
import express = require("express");

import { BiprocessInterface } from ".";
import { Server } from "http";

import { ServerConfig } from "../config";
import { ok } from "assert";

export class HTTPInterface implements BiprocessInterface {
    private app: Express | null;
    private router: Router;
    private server: Server | null;
    private options: string[];

    constructor(private config: ServerConfig, private runEnteredCommand: (s: string) => Promise<void>, private retrieveFromKey: (s: string) => Promise<string>) {
        this.app = null;
        this.server = null;

        ok(this.config.port, "There must be a port configured");
        ok(this.config.bind, "There must be a bind address configured");

        this.router = Router();
        this.router.get("*", (req: Request, res: Response) => {
    
            if (req.originalUrl === "/") {
                res.json(this.options);
            } else {
                this.retrieveFromKey(req.originalUrl).then((val) => {
                    if (val) {
                        res.type("application/json").send(val).end();
                    } else {
                        res.status(404).type("application/json").send("404").end();
                    }
                }).catch((err) => {
                    res.status(500).json(err);
                });
            }
        }).post("*", (req: Request, res: Response) => {
            this.runEnteredCommand(req.originalUrl).then(() => {
                res.json(req.originalUrl);
            }).catch((err: Error) => {
                res.status(500).json(err);
            });
        });
        this.options = [];
    }

    setOptions(options: string[]): void {
        this.options = options;
    }

    setJobs(): void {}

    run(): Promise<void> {
        if (this.app && this.server) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            this.app = express();
            this.app.use(this.router);
            this.server = this.app.listen(this.config.port, this.config.bind, () => {
                if (this.server && this.server.listening) {
                    console.debug("Listenning on port", this.config.port);
                    resolve();
                } else {
                    reject("Error trying to listen on port " + this.config.port);
                }
            });
        });
    }

    close(): Promise<void> {
        if (this.server) {
            const server = this.server;
            this.server = null;
            this.app = null;

            return new Promise((resolve, reject) => {
                server.close((err) => {
                    if (err) { reject(err); } else { resolve(); }
                });
            });
        }

        return Promise.resolve();
    }
}
