
const bcrypt = require("bcrypt");
const Cryptr = require("cryptr");

export function cryptPassword(password, callback) {
	bcrypt.genSalt(10, function(err, salt) {
		if (err){
			return callback(err);
		}

		bcrypt.hash(password, salt, callback);
	});
}

export function comparePassword(password, userPassword, callback) {
	bcrypt.compare(password, userPassword, function(err, isPasswordMatch) {
		return (err) ? callback(err) : callback(null, isPasswordMatch);
	});
}

export function crypt(password, content){
	const c = new Cryptr(password);

	return c.encrypt(content);
}

export function decrypt(password, content){
	const c = new Cryptr(password);

	return c.decrypt(content);
}
