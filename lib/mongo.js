(function(module){
    'use strict';

    module.exports.findAndReturnAsPromise = function(client, db, collection, projection, filter, sort, limit){
        return client.db(db).collection(collection).find(filter, {
            projection: projection,
            sort: sort,
            limit: limit
        }).toArray();
    };

    module.exports.aggregateAndReturnAsPromise = function(client, db, collection, pipeline){
        return client.db(db).collection(collection).aggregate(pipeline).toArray();
    };

})(module);
