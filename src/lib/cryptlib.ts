
import bcrypt = require("bcrypt");
import Cryptr = require("cryptr");

export function cryptPassword(password: string): Promise<string> {
	return bcrypt.genSalt(10).then((salt) => bcrypt.hash(password, salt));
}

export function comparePassword(password: string, userPassword: string): Promise<boolean> {
	return bcrypt.compare(password, userPassword);
}

export function crypt(password: string, content: string): string {
	const c = new Cryptr(password);

	return c.encrypt(content);
}

export function decrypt(password: string, content: string): string {
	const c = new Cryptr(password);

	return c.decrypt(content);
}
