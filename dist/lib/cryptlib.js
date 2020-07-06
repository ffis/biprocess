"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrypt = exports.crypt = exports.comparePassword = exports.cryptPassword = void 0;
var bcrypt = require("bcrypt");
var Cryptr = require("cryptr");
function cryptPassword(password, callback) {
    bcrypt.genSalt(10, function (err, salt) {
        if (err) {
            return callback(err);
        }
        bcrypt.hash(password, salt, callback);
    });
}
exports.cryptPassword = cryptPassword;
function comparePassword(password, userPassword, callback) {
    bcrypt.compare(password, userPassword, function (err, isPasswordMatch) {
        return (err) ? callback(err) : callback(null, isPasswordMatch);
    });
}
exports.comparePassword = comparePassword;
function crypt(password, content) {
    var c = new Cryptr(password);
    return c.encrypt(content);
}
exports.crypt = crypt;
function decrypt(password, content) {
    var c = new Cryptr(password);
    return c.decrypt(content);
}
exports.decrypt = decrypt;
//# sourceMappingURL=cryptlib.js.map