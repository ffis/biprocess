"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateAndReturnAsPromise = exports.findAndReturnAsPromise = void 0;
function findAndReturnAsPromise(client, db, collection, projection, filter, sort, limit) {
    return client.db(db).collection(collection).find(filter, {
        projection: projection,
        sort: sort,
        limit: limit
    }).toArray();
}
exports.findAndReturnAsPromise = findAndReturnAsPromise;
function aggregateAndReturnAsPromise(client, db, collection, pipeline) {
    return client.db(db).collection(collection).aggregate(pipeline).toArray();
}
exports.aggregateAndReturnAsPromise = aggregateAndReturnAsPromise;
//# sourceMappingURL=mongo.js.map