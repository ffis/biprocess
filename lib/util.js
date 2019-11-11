(function(module){
	'use strict';

	module.exports.queryAndReturnAsPromise = function(connection, query, parameters) {
		const pms = {type: connection.QueryTypes.SELECT};
		if (Object.keys(parameters).length > 1) {
			pms.bind = Object.assign({}, parameters);
			Reflect.deleteProperty(pms.bind, 'query');
		}

		return connection.query(query, pms);
	};

})(module);
