import { MongoClient } from "mongodb";

export function findAndReturnAsPromise(client: MongoClient, db, collection, projection, filter, sort, limit) {
    return client.db(db).collection(collection).find(filter, {
        projection: projection,
        sort: sort,
        limit: limit
    }).toArray();
}

export function aggregateAndReturnAsPromise(client: MongoClient, db, collection, pipeline) {
    return client.db(db).collection(collection).aggregate(pipeline).toArray();
}
