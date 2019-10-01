(function(module){
	'use strict';

    const findAndReturnAsPromise = require('../lib/mongo').findAndReturnAsPromise;
    const aggregateAndReturnAsPromise = require('../lib/mongo').aggregateAndReturnAsPromise;

	module.exports.genericFind = function(parameters){

        const client = parameters.mongodbclient,
            dbname = parameters.dbname,
            collection = parameters.collection,
            project = parameters.project || '{}',
            filter = parameters.filter || '{}',
            sort = parameters.sort || '{}';

		return findAndReturnAsPromise(client, dbname, collection, JSON.parse(project), JSON.parse(filter), JSON.parse(sort));
	};

    module.exports.genericAggregate = function(parameters){

        const client = parameters.mongodbclient,
            dbname = parameters.dbname,
            collection = parameters.collection,
            pipeline = parameters.pipeline || '[]';

		return aggregateAndReturnAsPromise(client, dbname, collection, JSON.parse(pipeline));
	};

})(module);
