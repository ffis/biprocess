import { MongoClient } from "mongodb";

export function findAndReturnAsPromise(client: MongoClient, db: string, collection: string, projection: object, filter: object, sort: object, limit: number): Promise<any[]> {
    return client.db(db).collection(collection).find(filter, {
        projection: projection,
        sort: sort,
        limit: limit
    }).toArray();
}

export function aggregateAndReturnAsPromise(client: MongoClient, db: string, collection: string, pipeline: object[]): Promise<any[]> {
    return client.db(db).collection(collection).aggregate(pipeline).toArray();
}
