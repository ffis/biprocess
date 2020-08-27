import { Config } from "./config";
import { MongoClient } from "mongodb";
import { Sequelize } from "sequelize/types";

export interface JobList {
    jobs: Jobs;
}

export interface Jobs {
    job: JobElement[];
}

export interface JobElement {
    $: JobClass;
    parameters: Parameter[];
    description?: string[];
    triggers?: Trigger[];
}

export interface JobClass {
    key: string;
    method: Method;
    cron?: string;
}

export enum Method {
    MongoGenericAggregate = "mongo.genericAggregate",
    MongoGenericFind = "mongo.genericFind",
    UtilGenericQuery = "util.genericQuery",
}

export interface Parameter {
    field: FieldElement[];
}

export interface FieldElement {
    $: Field;
    value: string[];
}

export interface Field {
    name: Name;
}

export enum Name {
    Collection = "collection",
    Dbname = "dbname",
    Filter = "filter",
    Limit = "limit",
    Pipeline = "pipeline",
    Project = "project",
    Query = "query",
    Sort = "sort",
}

export interface Trigger {
    on: OnElement[];
}

export interface OnElement {
    $: On;
}

export interface On {
    action: string;
    contains: string;
}

export type ConnectionType = Sequelize;

export interface JobParameters {
    config: Config;
    connection: ConnectionType;
    mongodbclient: MongoClient;
    dbname: string;
}
