"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var interfaces_1 = require("../../../interfaces/");
describe("Index Interface", function () {
    it("should be able to get Interfaces", function () {
        var runEnteredCommand = function () { return Promise.resolve(); };
        var config = {
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
        var interfaces = interfaces_1.getInterfaces(config, runEnteredCommand);
        expect(interfaces).toBeDefined();
        expect(Array.isArray(interfaces)).toBe(true);
        expect(interfaces.length).toEqual(0);
        config.quiet = false;
        config.server.enabled = false;
        config.redis.channels.listen = [];
        interfaces = interfaces_1.getInterfaces(config, runEnteredCommand);
        expect(interfaces).toBeDefined();
        expect(Array.isArray(interfaces)).toBe(true);
        expect(interfaces.length).toEqual(1);
        config.quiet = true;
        config.server.enabled = true;
        Reflect.deleteProperty(config.redis.channels, "listen");
        interfaces = interfaces_1.getInterfaces(config, runEnteredCommand);
        expect(interfaces).toBeDefined();
        expect(Array.isArray(interfaces)).toBe(true);
        expect(interfaces.length).toEqual(1);
        config.quiet = true;
        config.server.enabled = false;
        config.redis.channels.listen = ["a"];
        interfaces = interfaces_1.getInterfaces(config, runEnteredCommand);
        expect(interfaces).toBeDefined();
        expect(Array.isArray(interfaces)).toBe(true);
        expect(interfaces.length).toEqual(1);
        config.quiet = false;
        config.server.enabled = true;
        config.redis.channels.listen = ["a"];
        interfaces = interfaces_1.getInterfaces(config, runEnteredCommand);
        expect(interfaces).toBeDefined();
        expect(Array.isArray(interfaces)).toBe(true);
        expect(interfaces.length).toEqual(3);
    });
});
//# sourceMappingURL=index.spec.js.map