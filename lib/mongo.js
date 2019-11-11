(function(module){
    'use strict';

    module.exports.findAndReturnAsPromise = function(client, db, collection, project, filter, sort){
        return client.db(db).collection(collection).find(filter, {
            projection: project,
            sort: sort
        }).toArray();
    };

    module.exports.aggregateAndReturnAsPromise = function(client, db, collection, pipeline){
        return client.db(db).collection(collection).aggregate(pipeline).toArray();
    };

})(module);
