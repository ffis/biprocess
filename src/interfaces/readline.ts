import { EOL } from "os";
import { Interface } from "readline";
import * as readline from "readline";
import { AvailableCommands, BiprocessInterface, supportedCommandsDescription } from ".";
import { JobElement } from "../types";

export class Commands {

	public help(jobs: JobElement[], output: NodeJS.WritableStream): Promise<void> {
		const comms = Object.keys(supportedCommandsDescription).map(function (s) {
			return s + (typeof supportedCommandsDescription[s] === "string" ? EOL + "\t" + supportedCommandsDescription[s] : "");
		});
		const options = jobs.map(function (job) {
			return job.$.key + (job.description ? EOL + "\t" + job.description : "");
		}).concat(comms);

		output.write("\nThe available options are:\n");
		output.write(options.join(EOL) + "\n");

		return Promise.resolve();
	}
	
	isCommand(str: string): boolean {
		return Object.keys(AvailableCommands).indexOf(str) >= 0;
	}

	run(command: string, jobs: JobElement[], runEnteredCommand: (s: string) => Promise<void>, output: NodeJS.WritableStream): Promise<void> {

		if (this.isCommand(command)) {
			switch (command) {
				case  "help":
					return this.help(jobs, output);
			}
		}

		return runEnteredCommand(command);
	}
}

export interface ReadLineInterfaceOptions {
	runEnteredCommand: (s: string) => Promise<void>;
	input?: NodeJS.ReadableStream;
	output?: NodeJS.WritableStream;
}


export class ReadLineInterface implements BiprocessInterface {
	private rl: Interface | null;
	private options: string[];
	private jobs: JobElement[];
	private commands: Commands;
	private parameters: ReadLineInterfaceOptions;

	constructor(parameters: ReadLineInterfaceOptions) {
		this.rl = null;
		this.options = [];
		this.jobs = [];
		this.commands = new Commands();
		this.parameters = Object.assign({}, parameters);

		if (!this.parameters.input) {
			this.parameters.input = process.stdin;
		}
		if (!this.parameters.output) {
			this.parameters.output = process.stdout;
		}
	}

	setOptions(options: string[]): void {
		this.options = options;
	}

	setJobs(jobs: JobElement[]): void {
		this.jobs = jobs;
	}

	run(): Promise<void> {
		if (this.rl) {
			return Promise.resolve();
		}

		this.rl = readline.createInterface({
			input: this.parameters.input!,
			output: this.parameters.output!,
			prompt: "COMMAND> ",
			completer: this.completer.bind(this)
		});
		this.rl.on("line", (line) => {
			const command: Promise<void> = this.commands.run(line, this.jobs, this.parameters.runEnteredCommand, this.parameters.output!);
			command.catch((err) => {
				this.parameters.output!.write(String(err) + "\n", "utf-8");
			}).finally(() => {
				this.rl && this.rl.prompt();
			});
		}).on("close", () => {
			this.parameters.runEnteredCommand("quit");
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

	public completer(line: string): [string[], string] {
		const hits = this.options.filter((c) => c.startsWith(line));

		return [line.length ? hits : this.options, line];
	}
}