
import { AfterFunction, DecorateFunction, MethodKind } from "./types";

export function calculateKey(basekey: string, params: { [key: string]: string }): string {
	let newkey = basekey;
	if (typeof params === "object") {
		newkey = Object.keys(params).reduce(function (p, c) {
			return p.replace(":" + c, params[c]);
		}, newkey);
	}

	return newkey;
}

export function generator(fn: Function, obj: object, basekey: string, params: { [key: string]: any }, decorate: DecorateFunction, after: AfterFunction) {
	return function (): Promise<void> {
		
		decorate(params);

		return Reflect.apply(fn, obj, [params]).then((value: any[]) => {
			const newkey = calculateKey(basekey, params);
			after(value, newkey);

		}, (err: Error) => {
			console.error(basekey, err);
		});
	};
}


export function caller(functionname: MethodKind, obj: object, key: string, parameters: { [key: string]: string[] } | null, decorate: DecorateFunction, after: AfterFunction) {
	return function (): Promise<void> {
		if (typeof parameters === "undefined") {
			return generator(functionname, obj, key, {}, decorate, after)();
		}

		let callingparams = [{}];
		for (const attr in parameters) {
			const possiblevalues = parameters[attr];

			const cp = [];
			do {
				const p: {[s: string]: string} = callingparams.shift()!;

				for (const value in possiblevalues) {
					p[attr] = possiblevalues[value];
					cp.push(JSON.parse(JSON.stringify(p)));
				}

			} while (callingparams.length > 0);

			callingparams = cp;
		}

		const fns = callingparams.map((p) => generator(functionname, obj, key, p, decorate, after));

		return fns.reduce((p: Promise<void>, c) => p.then(() => c()), Promise.resolve());
	};
}
