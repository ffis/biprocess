import { connect, MongoClientOptions } from "mongodb";
import { Sequelize } from "sequelize";

import { Config } from "../config";
import { ConnectionType, MongoConnectionType } from "../types";

export function connectSQL(config: Config): Promise<ConnectionType> {
	const connection = new Sequelize(config.db.database, config.db.username, config.db.password, config.db.options);

	return connection.authenticate().then(() => connection);
}

export function connectMongo(config: Config): Promise<MongoConnectionType> {
	const options: MongoClientOptions = config.mongodb.options ? config.mongodb.options : { useNewUrlParser: true, useUnifiedTopology: true };

	return connect(config.mongodb.url, options);
}
