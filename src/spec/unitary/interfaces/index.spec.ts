import { getInterfaces } from "../../../interfaces/";
import { Config } from "../../../config";

describe("Index Interface", () => {
    it("should be able to get Interfaces", () => {
        const runEnteredCommand = () => Promise.resolve();
        const config: Config = {
            db: {
                database: "database",
                enabled: true,
                options: {
                    dialect: "mssql",
                    debug: true,
                    dialectOptions: {
                        encrypt: false,
                        options: {
                            enableArithAbort: false,
                            trustServerCertificate: false
                        }
                    },
                    host: "host",
                    logging: false
                },
                password: "password",
                username: "username"
            },
            debug: false,
            jobsDirectory: "",
            mongodb: {
                enabled: true,
                database: "database",
                url: "url"
            },
            redis: {
                channels: {
                    listen: []
                },
                host: "host",
                no_ready_check: false
            },
            server: {
                bind: "localhost",
                enabled: false,
                port: 9991
            },
            quiet: true
        };

        config.quiet = true;
        config.server.enabled = false;
        config.redis.channels.listen = [];
        let interfaces = getInterfaces(config, runEnteredCommand);
        expect(interfaces).toBeDefined();
        expect(Array.isArray(interfaces)).toBe(true);
        expect(interfaces.length).toEqual(0);

        config.quiet = false;
        config.server.enabled = false;
        config.redis.channels.listen = [];
        interfaces = getInterfaces(config, runEnteredCommand);
        expect(interfaces).toBeDefined();
        expect(Array.isArray(interfaces)).toBe(true);
        expect(interfaces.length).toEqual(1);

        config.quiet = true;
        config.server.enabled = true;
        Reflect.deleteProperty(config.redis.channels, "listen") ;
        interfaces = getInterfaces(config, runEnteredCommand);
        expect(interfaces).toBeDefined();
        expect(Array.isArray(interfaces)).toBe(true);
        expect(interfaces.length).toEqual(1);

        config.quiet = true;
        config.server.enabled = false;
        config.redis.channels.listen = ["a"];
        interfaces = getInterfaces(config, runEnteredCommand);
        expect(interfaces).toBeDefined();
        expect(Array.isArray(interfaces)).toBe(true);
        expect(interfaces.length).toEqual(1);

        config.quiet = false;
        config.server.enabled = true;
        config.redis.channels.listen = ["a"];
        interfaces = getInterfaces(config, runEnteredCommand);
        expect(interfaces).toBeDefined();
        expect(Array.isArray(interfaces)).toBe(true);
        expect(interfaces.length).toEqual(3);
    });
});
