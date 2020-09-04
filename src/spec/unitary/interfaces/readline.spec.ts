import { PassThrough } from "stream";

import { ReadLineInterface } from "../../../interfaces/readline";

import { Method, JobElement } from "../../../types";

describe("Readline Interface", () => {
    it("should work with default values", async () => {
        const runEnteredCommand = (_command: string) => Promise.resolve();
        const rlInterface = new ReadLineInterface({
            runEnteredCommand
        });

        return expectAsync(rlInterface.run()).toBeResolved()
            .then(() => expectAsync(rlInterface.run()).toBeResolved())
            .then(() => expectAsync(rlInterface.close()).toBeResolved())
            .then(() => expectAsync(rlInterface.close()).toBeResolved());
    });

    it("should work with valid values", async () => {
        const options = [
            "/api/1", "/api/2", "/api/3"
        ];
        const commandAvailable = "/mycommand";
        // const commandNotAvailable = "/mycommand2";
        const failingCommand = "/failing";

        // const storedValue = "[{\"a\": 1}]";
        let rlInterface: ReadLineInterface;

        let expectedValue: string;
        const apiDescription = "Api endpoint example";
        const runEnteredCommand = (command: string) => {
            expect(command).toEqual(expectedValue);

            return failingCommand === command ? Promise.reject() : Promise.resolve();
        };
        const jobs: JobElement[] = [
            {
                $: {
                    key: options[0],
                    method: Method.UtilGenericQuery,
                },
                description: [apiDescription],
                parameters: []
            },
            {
                $: {
                    key: options[1],
                    method: Method.UtilGenericQuery,
                },
                description: [apiDescription],
                parameters: []
            },
            {
                $: {
                    key: options[2],
                    method: Method.UtilGenericQuery,
                },
                description: [apiDescription],
                parameters: []
            }
        ];

        const input = new PassThrough();

        rlInterface = new ReadLineInterface({
            input,
            runEnteredCommand
        });

        rlInterface.setOptions(options);
        rlInterface.setJobs(jobs);
        expect(rlInterface.completer("/")).toEqual([options, "/"]);
        expect(rlInterface.completer(options[0])).toEqual([[options[0]], options[0]]);

        return expectAsync(rlInterface.run()).toBeResolved().then(() => {
            expectedValue = "help";
            input.write("help\n", "utf-8");
        }).then(() => {
            expectedValue = commandAvailable;
            input.write(commandAvailable + "\n", "utf-8");
        }).then(() => {
            expectedValue = failingCommand;
            input.write(failingCommand + "\n", "utf-8");
        }).then(() => {
            expectedValue = "quit";

            return expectAsync(rlInterface.close()).toBeResolved();
        });
    });
});
