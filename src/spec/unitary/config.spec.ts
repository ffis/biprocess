import { relative, resolve } from "path";
import { getConfig } from "../../config";

const referenceDirectory = resolve(__dirname, "..", "..", "..", "src", "spec", "testdata");

describe("config", () => {
    it("should be load config file", async () => {
        const config = getConfig(resolve(referenceDirectory, "config.json"));
        expect(config).toBeDefined();
    });

    it("should be load config file using relative path", async () => {
        const abspath = resolve(referenceDirectory, "config.json");
        const config = getConfig(relative(process.cwd(), abspath));
        expect(config).toBeDefined();
    });

    it("should fail when loading a wrong config file", async () => {
        expect(() => {
            getConfig(resolve(referenceDirectory, "random", "config.json"));
        }).toThrow();
    });
});
