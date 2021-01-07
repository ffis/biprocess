import { readFileSync } from "fs";

export function readJSONFileSync<T>(path: string): T {
    return JSON.parse(String(readFileSync(path, "utf8"))) as T;
}