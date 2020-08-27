
import { aggregateAndReturnAsPromise, findAndReturnAsPromise } from "../lib/mongo";
import { JobParameters } from "../types";

export interface GenericFindParameters extends JobParameters {
    collection: string;
    project?: string;
    filter?: string;
    sort?: string;
    limit?: number;
}

export interface GenericAggregateParameters extends JobParameters {
    collection: string;
    pipeline?: string;
}

export function genericFind(parameters: GenericFindParameters) {

    const client = parameters.mongodbclient,
        dbname = parameters.dbname,
        collection = parameters.collection,
        project = parameters.project || '{}',
        filter = parameters.filter || '{}',
        sort = parameters.sort || '{}',
        limit = parameters.limit || 0;

    return findAndReturnAsPromise(client, dbname, collection, JSON.parse(project), JSON.parse(filter), JSON.parse(sort), Number(limit));
}

export function genericAggregate(parameters: GenericAggregateParameters) {

    const client = parameters.mongodbclient,
        dbname = parameters.dbname,
        collection = parameters.collection,
        pipeline = parameters.pipeline || '[]';

    return aggregateAndReturnAsPromise(client, dbname, collection, JSON.parse(pipeline));
}
