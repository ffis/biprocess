import { relative, resolve } from "path";
import { configProvider } from "../../providers/config";

const referenceDirectory = resolve(
  __dirname,
  "..",
  "..",
  "..",
  "src",
  "spec",
  "testdata"
);

describe("config", () => {
  it("should be load config file", () => {
    const config = configProvider([
      "",
      "",
      "--config",
      resolve(referenceDirectory, "config.json"),
    ]);
    expect(config).toBeDefined();
  });

  it("should be load config file using relative path", () => {
    const abspath = resolve(referenceDirectory, "config.json");
    const config = configProvider([
      "",
      "",
      "--config",
      relative(process.cwd(), abspath)]);
    expect(config).toBeDefined();
  });

  it("should fail when loading a wrong config file", () => {
    expect(() => {
      configProvider([
        "",
        "",
        "--config",
        resolve(referenceDirectory, "random", "config.json"),
      ]);
    }).toThrow();
  });
});
