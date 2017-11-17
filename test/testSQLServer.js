/*global describe */
/*global before */
/*global it */
/*global after */
(function(logger){
	'use strict';

	var path = require('path'),
		sql = require('mssql'),
		chai = require('chai'),
		expect = chai.expect,
		should = chai.should,
		config = require(path.join(__dirname, '..', 'config.json'));

	if (typeof describe === 'function'){
		describe('SQL Server test', function(){
			var connection;
			before(function(){

			});
			it('should be able to connect', function(done){
				connection = new sql.Connection(config.db, function(err){
					should(err).not.exist();
					done();
				});
			});
			it('should be able to query', function(done){
				var request = connection.request();
				request.query('select 1 as value',
					function(err, recordset) {
						should(err).not.exist();
						expect(recordset[0].value).equals(1);
						done();
					}
				);
			});
			it('should close connection safely', function(done){
				connection.on('close', function(){
					done();
				});
				connection.on('error', function(err){
					should(err).not.exist();
					done();
				});
				connection.close();
			});

			after(function(){
			});
		});
	}
})(console);