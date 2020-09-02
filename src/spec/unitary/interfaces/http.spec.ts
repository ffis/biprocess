import { HTTPInterface } from "../../../interfaces/http";
import { ServerConfig } from "../../../config";

// import {} from "supertest";

import request = require("supertest");

import getPort = require('get-port');

describe("HTTPInterface", () => {
    it("should fail work with non valid values", async () => {
        const config: ServerConfig = {
            bind: "localhost",
            port: 1,
            enabled: true
        };
        const runEnteredCommand = (_command: string) => Promise.resolve();

        const retrieveFromKey = (_s: string) => Promise.resolve("");

        const httpInterface = new HTTPInterface({
            config,
            logger: console,
            retrieveFromKey,
            runEnteredCommand
        });

        httpInterface.setOptions([]);
        httpInterface.setJobs();

        return await expectAsync(httpInterface.run()).toBeRejected();
    });

    it("should work with default values", (done: DoneFn) => {
        const options = [
            "a", "b", "c"
        ];
        const commandAvailable = "/mycommand";
        const commandNotAvailable = "/mycommand2";
        const failingCommand = "/failing";

        const storedValue = "[{\"a\": 1}]";
        let httpInterface: HTTPInterface;

        let expectedValue: string;

        getPort().then((port) => {
            const config: ServerConfig = {
                bind: "localhost",
                port,
                enabled: true
            };
            const runEnteredCommand = (command: string) => {
                expect(command).toEqual(expectedValue);

                return failingCommand === command ? Promise.reject() : Promise.resolve();
            };

            const retrieveFromKey = (_s: string) => {
                expect(_s).toEqual(expectedValue);

                if (failingCommand === _s) {
                    return Promise.reject();
                }

                return commandNotAvailable === _s ? Promise.resolve("") : Promise.resolve(storedValue);
            };

            httpInterface = new HTTPInterface({config, runEnteredCommand, retrieveFromKey});

            httpInterface.setOptions(options);
            httpInterface.setJobs();
            return expectAsync(httpInterface.run()).toBeResolved();
        }).then(() => new Promise((resolve) => {
            request(httpInterface.app)
                .get("/")
                .expect("Content-Type", /json/)
                .expect(200, options, () => {
                        resolve();
                });
        })
        ).then(() => new Promise((resolve) => {
            expectedValue = commandAvailable;
            request(httpInterface.app)
                .post(commandAvailable)
                .expect("Content-Type", /json/)
                .expect(200, commandAvailable, () => {
                    resolve();
                });
            })
        ).then(() => new Promise((resolve) => {
            expectedValue = commandNotAvailable;
            request(httpInterface.app)
                .post(commandNotAvailable)
                .expect("Content-Type", /json/)
                .expect(404, () => {
                    resolve();
                });
            })
        ).then(() => new Promise((resolve) => {
            expectedValue = commandNotAvailable;
            request(httpInterface.app)
                .get(commandNotAvailable)
                .expect("Content-Type", /json/)
                .expect(404, () => {
                    resolve();
                });
            })
        ).then(() => new Promise((resolve) => {
            expectedValue = failingCommand;
            request(httpInterface.app)
                .get(failingCommand)
                .expect("Content-Type", /json/)
                .expect(500, () => {
                    resolve();
                });
            })
        ).then(() => new Promise((resolve) => {
            expectedValue = failingCommand;
            request(httpInterface.app)
                .post(failingCommand)
                .expect("Content-Type", /json/)
                .expect(500, () => {
                    resolve();
                });
            })
        ).then(() => new Promise((resolve) => {
            expectedValue = commandAvailable;

            request(httpInterface.app)
                .get(commandAvailable)
                .expect("Content-Type", /json/)
                .expect(200, JSON.parse(storedValue), () => {
                    resolve();
                });
            })
        ).then(() => {
            return expectAsync(httpInterface.run()).toBeResolved();
        }).then(() => {
            return expectAsync(httpInterface.close()).toBeResolved();
        }).then(() => {
            return expectAsync(httpInterface.close()).toBeResolved();
        }).then(() => {
            done();
        });
        
    });
});
