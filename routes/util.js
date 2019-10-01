(function(module){
    'use strict';
    const fs = require('fs'),
        path = require('path'),
        Q = require('q');

	const queryAndReturnAsPromise = require('../lib/util').queryAndReturnAsPromise;

	module.exports.genericQuery = function(parameters) {
		const query = parameters.query.trim();

		return queryAndReturnAsPromise(parameters.connection, query, parameters);
    };

    module.exports.loadJSONFromFile = function(parameters) {        // TODO: I don't know if it should check if the file lays inside the biprocess directory.
        const defer = Q.defer();
        const filename = parameters.filename.trim();

        if (filename.indexOf('://') >= 0) { // guess it has a protocol
            fs.readFile(filename, 'utf8', defer.makeNodeResolver());
        } else {
            const filepath = filename[0] === '/' ? filename : path.resolve(__dirname, '..', filename);
            fs.readFile(filepath, 'utf8', defer.makeNodeResolver());
        }

        return defer.promise.then(function(data) { return JSON.parse(data); });
    };

})(module);
