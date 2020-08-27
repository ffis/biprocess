"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrypt = exports.crypt = exports.comparePassword = exports.cryptPassword = void 0;
var bcrypt = require("bcrypt");
var Cryptr = require("cryptr");
function cryptPassword(password) {
    return bcrypt.genSalt(10).then(function (salt) { return bcrypt.hash(password, salt); });
}
exports.cryptPassword = cryptPassword;
function comparePassword(password, userPassword) {
    return bcrypt.compare(password, userPassword);
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