"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genericAggregate = exports.genericFind = void 0;
var mongo_1 = require("../lib/mongo");
function genericFind(parameters) {
    var client = parameters.mongodbclient, dbname = parameters.dbname, collection = parameters.collection, project = parameters.project || '{}', filter = parameters.filter || '{}', sort = parameters.sort || '{}', limit = parameters.limit || 0;
    return mongo_1.findAndReturnAsPromise(client, dbname, collection, JSON.parse(project), JSON.parse(filter), JSON.parse(sort), JSON.parse(limit));
}
exports.genericFind = genericFind;
function genericAggregate(parameters) {
    var client = parameters.mongodbclient, dbname = parameters.dbname, collection = parameters.collection, pipeline = parameters.pipeline || '[]';
    return mongo_1.aggregateAndReturnAsPromise(client, dbname, collection, JSON.parse(pipeline));
}
exports.genericAggregate = genericAggregate;
//# sourceMappingURL=mongo.js.map