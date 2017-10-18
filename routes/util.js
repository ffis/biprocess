(function(module){
	'use strict';

	const queryAndReturnAsPromise = require('../lib/util').queryAndReturnAsPromise;

	module.exports.genericQuery = function(connection, parameters){
		const query = parameters.query.trim();

		return queryAndReturnAsPromise(connection, query, parameters);
	};

})(module);
