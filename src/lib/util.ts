import { QueryTypes } from "sequelize";

import { GenericQueryParameters } from "../routes/util";
import { ConnectionType } from "../types";

export function queryAndReturnAsPromise(connection: ConnectionType, query: string, parameters: GenericQueryParameters) {
	const pms = {
		bind: Object.keys(parameters).length > 1 ? Object.assign({}, parameters, {query: null}) : undefined,
		type: QueryTypes.SELECT
	};

	return connection.query(query, pms);
}
