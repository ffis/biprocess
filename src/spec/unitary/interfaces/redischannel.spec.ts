import { RedisChannelInterface, Subscribable } from "../../../interfaces/redischannel";

// import { Method, JobElement } from "../../../types";
import { RedisConfig } from "../../../config";
import { JobElement, Method } from "../../../types";

type Callback = (channel: string, message: string) => void;

class FakeSubscribable implements Subscribable {
    public listenningChannels: string[];
    public callbacks: {
        [event: string] : Callback[];
    };

    constructor() {
        this.callbacks = {};
        this.listenningChannels = [];
    }

    on(event: string, cb: Callback): void {
        if (typeof this.callbacks[event] === "undefined") {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(cb)
    }

    emit(event: string, channel: string, message: string): void {
        this.callbacks[event]?.forEach((cb) => {
            setImmediate(() => {
                cb(channel, message);
            });
        });
    }

    quit() {
        this.callbacks = {};
        this.listenningChannels = [];
    }

    subscribe(channel: string) {
        this.listenningChannels.push(channel);
    }

    unsubscribe() {
        this.listenningChannels = [];
    }
}

describe("RedisChannel Interface", () => {
    beforeEach(function() {
        jasmine.clock().install();
    });
    
    afterEach(function() {
        jasmine.clock().uninstall();
    });

    it("should work", async () => {
        let expectedValue: string;
        const config: RedisConfig = {
            channels: {
                listen: ["a"]
            },
            host: "localhost",
            no_ready_check: true
        };

        const fake = new FakeSubscribable();
        const createClient = () => fake;

        const runEnteredCommand = (_command: string) => {
            return expectedValue === _command ? Promise.resolve() : Promise.reject();
        };

        const rcInterface = new RedisChannelInterface({
            config,
            createClient,
            runEnteredCommand
        });

        const options = [
            "a", "b", "c"
        ];
        const apiDescription = "Api endpoint example";

        const jobs: JobElement[] = [
            {
                $: {
                    key: "/api",
                    method: Method.UtilGenericQuery,
                },
                description: [apiDescription],
                parameters: [],
                triggers: [
                    {
                        on: [
                            {$: {action: config.channels.listen[0], contains: apiDescription.split(" ")[0]}}
                        ]
                    }
                ]
            }
        ];

        rcInterface.setOptions(options);
        rcInterface.setJobs(jobs);

        return expectAsync(rcInterface.run()).toBeResolved()
            .then(() => expectAsync(rcInterface.run()).toBeResolved())
            .then(() => {
                console.log(fake.listenningChannels)
                expect(fake.listenningChannels).withContext("listenningChannels to be equals").toEqual(config.channels.listen);
                expect(fake.callbacks.message).withContext("callbacks.message to be defined").toBeDefined();
                expect(fake.callbacks.message.length).withContext("callbacks.message.length").toBe(1);
            })
            .then(() => {
                expectedValue = "";
                fake.emit("message", config.channels.listen[0], "this is a test");
                jasmine.clock().tick(1);
                expectedValue = jobs[0].$.key;
                fake.emit("message", config.channels.listen[0], apiDescription);
                jasmine.clock().tick(1);
                expectedValue = "failed";
                fake.emit("message", config.channels.listen[0], apiDescription);
                jasmine.clock().tick(1);
            })
            .then(() => expectAsync(rcInterface.close()).toBeResolved())
            .then(() => expectAsync(rcInterface.close()).toBeResolved());
    });

});
