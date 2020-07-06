export function queryAndReturnAsPromise(connection, query, parameters) {
	const pms = {type: connection.QueryTypes.SELECT, bind: null};
	if (Object.keys(parameters).length > 1) {
		pms.bind = Object.assign({}, parameters);
		Reflect.deleteProperty(pms.bind, "query");
	}

	return connection.query(query, pms);
}
