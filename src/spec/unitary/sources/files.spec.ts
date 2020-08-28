
import { loadFromJobsFile, loadFromJobsDirectory, loadXML, xml2jobs } from "../../../lib/sources/files";
import { resolve } from "path";

const referenceDirectory = resolve(__dirname, "..", "..", "..", "..", "src", "spec", "testdata");

describe("sources/files", () => {
    it("should be load from job.xml file", async () => {
        const content = await loadFromJobsFile(referenceDirectory);
        expect(content).toBeDefined();
    });

    it("should fail to load from a wrong job.xml file", async () => {
        await expectAsync(loadFromJobsFile(resolve(referenceDirectory, "random"))).toBeRejected();
    });

    it("should be load from jobs directory", async () => {
        const content = await loadFromJobsDirectory(referenceDirectory, "jobsdirectory");
        expect(content).toBeDefined();
    });

    it("should fail to load from a wrong jobs directory", async () => {
        await expectAsync(loadFromJobsDirectory(referenceDirectory, "random")).toBeRejected();
    });

    it("should be able to load using loadXML with no directory", async () => {
        const content = await loadXML(referenceDirectory);
        expect(content).toBeDefined();
    });

    it("should be able to load using loadXML with directory", async () => {
        const content = await loadXML(referenceDirectory, "jobsdirectory");
        expect(content).toBeDefined();
        expect(content.length).toEqual(2);
    });

    it("should be able to load using loadXML with directory", async () => {
        const content = await loadXML(referenceDirectory, "jobsdirectory");
        const processed = await xml2jobs(content);
        expect(processed).toBeDefined();
        expect(processed.jobs.job.length).toEqual(2);
    });

    it("should be able to load using loadXML with no directory", async () => {
        const content = await loadXML(referenceDirectory);
        const processed = await xml2jobs(content);
        expect(processed).toBeDefined();
        expect(processed.jobs.job.length).toEqual(3);
    });
});
