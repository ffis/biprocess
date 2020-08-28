"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectMongo = exports.connectSQL = void 0;
var mongodb_1 = require("mongodb");
var sequelize_1 = require("sequelize");
function connectSQL(config) {
    var connection = new sequelize_1.Sequelize(config.db.database, config.db.username, config.db.password, config.db.options);
    return connection.authenticate().then(function () { return connection; });
}
exports.connectSQL = connectSQL;
function connectMongo(config) {
    var options = config.mongodb.options ? config.mongodb.options : { useNewUrlParser: true, useUnifiedTopology: true };
    return mongodb_1.connect(config.mongodb.url, options);
}
exports.connectMongo = connectMongo;
//# sourceMappingURL=connections.js.map