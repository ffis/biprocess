import { Sequelize } from "sequelize";

import { Config } from "../../config";
import { ConnectionType } from "../../types";

export function connectSQL(config: Config): Promise<ConnectionType> {
  const connection = new Sequelize(
    config.db.database,
    config.db.username,
    config.db.password,
    config.db.options
  );

  return connection.authenticate().then(() => connection);
}
