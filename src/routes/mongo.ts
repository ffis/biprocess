import { JobParameters, MongoClientLike } from "../types";

export interface GenericFindParameters extends JobParameters {
  collection: string;
  project?: string;
  filter?: string;
  sort?: string;
  limit?: number;
}

export interface GenericGroupedAggregate extends JobParameters {
  collection: string;
  pipeline?: string;
}

export interface GenericAggregateParameters extends JobParameters {
  collection: string;
  pipeline?: string;
}

export function genericFind(
  parameters: GenericFindParameters
): Promise<unknown[]> {
  const client = parameters.mongodbclient,
    dbname = parameters.dbname,
    collection = parameters.collection,
    project = parameters.project || "{}",
    filter = parameters.filter || "{}",
    sort = parameters.sort || "{}",
    limit = parameters.limit || 0;

  return findAndReturnAsPromise(
    client,
    dbname,
    collection,
    JSON.parse(project),
    JSON.parse(filter),
    JSON.parse(sort),
    Number(limit)
  );
}

export function genericAggregate(
  parameters: GenericAggregateParameters
): Promise<unknown[]> {
  const client = parameters.mongodbclient,
    dbname = parameters.dbname,
    collection = parameters.collection,
    pipeline = parameters.pipeline || "[]";

  return aggregateAndReturnAsPromise(
    client,
    dbname,
    collection,
    JSON.parse(pipeline)
  );
}

export function groupedAggregate(
  parameters: GenericGroupedAggregate
): Promise<unknown[]> {
  const client = parameters.mongodbclient,
    dbname = parameters.dbname,
    collection = parameters.collection,
    pipeline = parameters.pipeline || "[]";

  return aggregateAndReturnAsPromise(
    client,
    dbname,
    collection,
    JSON.parse(pipeline)
  );
}

function findAndReturnAsPromise(
  client: MongoClientLike,
  db: string,
  collection: string,
  projection: Record<string, unknown>,
  filter: Record<string, unknown>,
  sort: Record<string, number>,
  limit: number
): Promise<unknown[]> {
  return client
    .db(db)
    .collection(collection)
    .find(filter, {
      projection: projection,
      sort: sort,
      limit: limit,
    })
    .toArray();
}

function aggregateAndReturnAsPromise(
  client: MongoClientLike,
  db: string,
  collection: string,
  pipeline: Record<string, unknown>[]
): Promise<unknown[]> {
  return client.db(db).collection(collection).aggregate(pipeline).toArray();
}
