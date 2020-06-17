(function(module){
	'use strict';

	const bcrypt = require('bcrypt');
	const Cryptr = require('cryptr');

	module.exports.cryptPassword = function(password, callback) {
		bcrypt.genSalt(10, function(err, salt) {
			if (err){
				return callback(err);
			}

			bcrypt.hash(password, salt, callback);
		});
	};

	module.exports.comparePassword = function(password, userPassword, callback) {
		bcrypt.compare(password, userPassword, function(err, isPasswordMatch) {
			return (err) ? callback(err) : callback(null, isPasswordMatch);
		});
	};

	module.exports.crypt = function(password, content){
		const c = new Cryptr(password);

		return c.encrypt(content);
	};

	module.exports.decrypt = function(password, content){
		const c = new Cryptr(password);

		return c.decrypt(content);
	};

})(module);
