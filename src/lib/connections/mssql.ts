import { Sequelize } from "sequelize";

import { IConfig } from "../../types/config";
import { ConnectionType } from "../../types";

export function connectSQL(config: IConfig): Promise<ConnectionType> {
  const connection = new Sequelize(
    config.db.database,
    config.db.username,
    config.db.password,
    config.db.options
  );

  return connection.authenticate().then(() => connection);
}
