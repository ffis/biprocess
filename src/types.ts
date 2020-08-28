import { Config } from "./config";
import { MongoClient } from "mongodb";
import { Sequelize } from "sequelize/types";
import { Job as nodeschedulejob } from "node-schedule";

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
export type MongoConnectionType = MongoClient;

export interface JobParameters {
    config: Config;
    connection: ConnectionType;
    mongodbclient: MongoConnectionType;
    dbname: string;
}

export type MethodKind = () => Promise<any[]>;

export interface Library {
    [method: string]: MethodKind;
}

export interface Libraries {
    [s: string]: Library;
}

export type callerType = (functionname: MethodKind, obj: any, key: string, parameters: { [key: string]: string[] } | null, decorate: DecorateFunction, after: AfterFunction) => () => void;

export type ScheduleJob = (name: string, rule: string, callback: () => void) => Job;

export type Job = nodeschedulejob;

export type DecorateFunction = (params: {[key: string]: any}) => void;
export type AfterFunction = (value: any[], newkey: string) => void;
