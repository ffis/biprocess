import { GenericQueryParameters } from "../routes/util";
import { ConnectionType } from "../types";
import { QueryTypes } from "sequelize";

export function queryAndReturnAsPromise(connection: ConnectionType, query: string, parameters: GenericQueryParameters) {
	const pms = {
		bind: Object.keys(parameters).length > 1 ? Object.assign({}, parameters, {query: null}) : undefined,
		type: QueryTypes.SELECT
	};

	return connection.query(query, pms);
}
