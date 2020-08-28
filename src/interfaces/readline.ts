import { Interface } from "readline";
import * as readline from "readline";
import { BiprocessInterface } from ".";

export class ReadLineInterface implements BiprocessInterface {
    private rl: Interface | null;
    private options: string[];

    constructor(private runEnteredCommand: (s: string) => Promise<void>) {
        this.rl = null;
        this.options = [];
    }

    setOptions(options: string[]): void {
        this.options = options;
    }

    setJobs(): void {}

    run(): Promise<void> {
        if (this.rl) {
            return Promise.resolve();
        }

        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: "COMMAND> ",
            completer: this.completer.bind(this)
        });
        this.rl.on("line", (line) => {
            this.runEnteredCommand(line).finally(() => {
                this.rl && this.rl.prompt();
            });
        }).on("close", function () {
            process.exit(0);
        });
        this.rl.prompt();

        return Promise.resolve();
    }

    close(): Promise<void> {
        if (!this.rl) {
            return Promise.resolve();
        }

        this.rl.close();
        this.rl = null;

        return Promise.resolve();
    }

    private completer(line: string) {
        const hits = this.options.filter((c) => c.startsWith(line));

        return [hits.length ? hits : this.options, line];
    }
}