import { MongoClientOptions } from "mongodb";

export interface DbConfig {
  enabled: boolean;
  database: string;
  username: string;
  password: string;
  options: {
    dialect: "mysql" | "postgres" | "sqlite" | "mariadb" | "mssql" | undefined;
    host: string;
    logging: boolean;
    debug: boolean;
    dialectOptions: {
      encrypt: boolean;
      options: {
        enableArithAbort: boolean;
        trustServerCertificate: boolean;
      };
    };
  };
}

export interface MongoDBConfig {
  enabled: boolean;
  url: string;
  database: string;
  options?: MongoClientOptions;
}

export interface RedisConfig {
  url: string;
  channels: {
    listen: string[];
  };
}

export interface ServerConfig {
  enabled: boolean;
  port: number;
  bind: string;
}

export interface IConfig {
  db: DbConfig;
  mongodb: MongoDBConfig;
  redis: RedisConfig;
  debug: boolean;
  jobsDirectory: string;
  server: ServerConfig;
  quiet?: boolean;
}
