(function(module, logger){
	'use strict';
	const Q = require('q');

	module.exports.findAndReturnAsPromise = function(client, db, collection, project, filter, sort){
		const col = client.db(db).collection(collection);
        const defer = Q.defer();
        col.find(filter, {
            projection: project,
            sort: sort
        }).toArray(defer.makeNodeResolver());

		return defer.promise;
    };

    module.exports.aggregateAndReturnAsPromise = function(client, db, collection, pipeline){
		const col = client.db(db).collection(collection);
        const defer = Q.defer();
        col.aggregate(pipeline).toArray(defer.makeNodeResolver());

		return defer.promise;
    };

})(module, console);
