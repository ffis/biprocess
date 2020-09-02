
import { XMLJobSource } from "../../../lib/sources/files";
import { resolve } from "path";

const referenceDirectory = resolve(__dirname, "..", "..", "..", "..", "src", "spec", "testdata");

describe("sources/files", () => {
    it("should be load from job.xml file", async () => {
        const source = new XMLJobSource({referenceDirectory});
        const content = await source.loadJobs();
        expect(content).toBeDefined();
    });

    it("should fail to load from a wrong job.xml file", async () => {
        const source = new XMLJobSource({referenceDirectory: resolve(referenceDirectory, "random")});
        await expectAsync(source.loadJobs()).toBeRejected();
    });

    it("should be load from jobs directory", async () => {
        const source = new XMLJobSource({referenceDirectory, jobsDirectory: "jobsdirectory"});
        const content = await source.loadJobs();
        expect(content).toBeDefined();
    });

    it("should fail to load from a wrong jobs directory", async () => {
        const source = new XMLJobSource({referenceDirectory, jobsDirectory: "random"});
        await expectAsync(source.loadJobs()).toBeRejected();
    });

    it("should be able to load using loadXML with no directory", async () => {
        const source = new XMLJobSource({referenceDirectory});
        const content = await source.loadJobs();
        expect(content).toBeDefined();
    });

    it("should be able to load using loadXML with directory", async () => {
        const source = new XMLJobSource({referenceDirectory, jobsDirectory: "jobsdirectory"});
        const content = await source.loadJobs();
        expect(content).toBeDefined();
        expect(content.length).toEqual(2);
    });

    it("should be able to load using loadXML with no directory", async () => {
        const source = new XMLJobSource({referenceDirectory});
        const content = await source.loadJobs();
        expect(content).toBeDefined();
        expect(content.length).toEqual(3);
    });
});
