
import { aggregateAndReturnAsPromise, findAndReturnAsPromise } from "../lib/mongo";

export function genericFind(parameters) {

    const client = parameters.mongodbclient,
        dbname = parameters.dbname,
        collection = parameters.collection,
        project = parameters.project || '{}',
        filter = parameters.filter || '{}',
        sort = parameters.sort || '{}',
        limit = parameters.limit || 0;

    return findAndReturnAsPromise(client, dbname, collection, JSON.parse(project), JSON.parse(filter), JSON.parse(sort), JSON.parse(limit));
}

export function genericAggregate(parameters) {

    const client = parameters.mongodbclient,
        dbname = parameters.dbname,
        collection = parameters.collection,
        pipeline = parameters.pipeline || '[]';

    return aggregateAndReturnAsPromise(client, dbname, collection, JSON.parse(pipeline));
}
