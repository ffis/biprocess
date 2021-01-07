import {
  HTTPInterface,
  HelpCommandOutput,
  HelpCommandOutputItem,
} from "../../../lib/interfaces/http";
import { ServerConfig } from "../../../types/config";

import request = require("supertest");

import getPort = require("get-port");
import { Method, JobElement } from "../../../types";

interface ThisDescribe {
  config: ServerConfig;
}

interface ThisSpec extends ThisDescribe {
  httpInterface: HTTPInterface;
}

describe("HTTPInterface", () => {
  it("should fail work with non valid values", async () => {
    const config: ServerConfig = {
      bind: "localhost",
      port: 1,
      enabled: true,
    };
    const runEnteredCommand = (_command: string) => Promise.resolve();

    const retrieveFromKey = (_s: string) => Promise.resolve("");

    const httpInterface = new HTTPInterface({
      config,
      logger: console,
      retrieveFromKey,
      runEnteredCommand,
    });

    httpInterface.setOptions([]);
    httpInterface.setJobs([]);

    return await expectAsync(httpInterface.run()).toBeRejected();
  });

  beforeAll(async function (this: ThisDescribe) {
    const port = await getPort();
    this.config = {
      bind: "localhost",
      port,
      enabled: true,
    };
  });

  const options = ["a", "b", "c"];
  const commandAvailable = "/mycommand";
  const commandNotAvailable = "/mycommand20";
  const failingCommand = "/failing";

  const storedValue = '[{"a": 1}]';

  let expectedValue: string;

  const apiDescription = "Api endpoint example";

  beforeEach(async function (this: ThisSpec) {
    const runEnteredCommand = (command: string) => {
      expect(command).toEqual(expectedValue);
      if (command === commandNotAvailable) {
        return Promise.reject({ status: 404, message: "Command not found" });
      }

      return failingCommand === command
        ? Promise.reject({ status: 500, message: "Command errored" })
        : Promise.resolve();
    };

    const retrieveFromKey = (_s: string) => {
      expect(_s).toEqual(expectedValue);

      if (failingCommand === _s) {
        return Promise.reject({ status: 500, message: "Failing command" });
      }

      return commandNotAvailable === _s
        ? Promise.resolve("")
        : Promise.resolve(storedValue);
    };
    const jobs: JobElement[] = [
      {
        $: {
          key: "/api",
          method: Method.UtilGenericQuery,
        },
        description: [apiDescription],
        parameters: [],
      },
    ];
    this.httpInterface = new HTTPInterface({
      config: this.config,
      runEnteredCommand,
      retrieveFromKey,
    });

    this.httpInterface.setOptions(options);
    this.httpInterface.setJobs(jobs);

    await this.httpInterface.run();
  });

  it("should be able to list options", function (this: ThisSpec) {
    return request(this.httpInterface.app)
      .get("/")
      .expect("Content-Type", /json/)
      .expect(200)
      .then((req) => {
        expect(req.body).toEqual(options);
      });
  });
  it("should be able to run an available command", function (this: ThisSpec) {
    expectedValue = commandAvailable;

    return request(this.httpInterface.app)
      .post(commandAvailable)
      .expect("Content-Type", /json/)
      .expect(200)
      .then((req) => {
        expect(req.body).toEqual(expectedValue);
      });
  });

  it("should not be able to run a non available command", function (this: ThisSpec) {
    expectedValue = commandNotAvailable;

    return (
      request(this.httpInterface.app)
        .post(commandNotAvailable)
        .expect("Content-Type", /json/)
        .expect(404)
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        .then(() => {})
    );
  });
  it("should be not be able to get a failing command", function (this: ThisSpec) {
    expectedValue = failingCommand;

    return (
      request(this.httpInterface.app)
        .get(failingCommand)
        .expect("Content-Type", /json/)
        .expect(500)
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        .then(() => {})
    );
  });
  it("should be not be able to run a failing command", function (this: ThisSpec) {
    expectedValue = failingCommand;

    return (
      request(this.httpInterface.app)
        .post(failingCommand)
        .expect("Content-Type", /json/)
        .expect(500)
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        .then(() => {})
    );
  });
  it("should be not be able to get a working command", function (this: ThisSpec) {
    expectedValue = commandAvailable;

    return request(this.httpInterface.app)
      .get(commandAvailable)
      .expect("Content-Type", /json/)
      .expect(200)
      .then((req) => {
        expect(req.body).toEqual(JSON.parse(storedValue));
      });
  });
  it("should be not be able to list commands", function (this: ThisSpec) {
    expectedValue = "/help";

    return request(this.httpInterface.app)
      .post("/help")
      .expect("Content-Type", /json/)
      .expect(200)
      .then((response) => {
        const commands: HelpCommandOutput = response.body;
        expect(commands).toBeDefined();
        expect(typeof commands).toBe("object");
        expect(Array.isArray(commands)).toBeTrue();
        const apiCommand = commands.find(
          (c: HelpCommandOutputItem) => c.command === "/api"
        );
        expect(apiCommand).toBeDefined();
        if (apiCommand) {
          expect(apiCommand.description).toBe(apiDescription);
        }
      });
  });

  afterEach(async function (this: ThisSpec) {
    await expectAsync(this.httpInterface.run()).toBeResolved();
    await expectAsync(this.httpInterface.close()).toBeResolved();
    await expectAsync(this.httpInterface.close()).toBeResolved();
  });
});
