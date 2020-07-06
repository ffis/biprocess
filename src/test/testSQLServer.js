/*global describe */
/*global before */
/*global it */
/*global after */
(function(logger){
	'use strict';

	var path = require('path'),
		Sequelize = require('sequelize'),
		chai = require('chai'),
		expect = chai.expect,
		should = chai.should,
		config = require(path.join(__dirname, '..', '..', 'config.json'));

	if (config.db.options.logging){
		config.db.options.logging = console.log;
	}

	if (typeof describe === 'function'){
		describe('SQL Server connection test', function(){
			this.timeout(10000);
			var connection;
			before(function(){

			});
			it('should be able to connect', function(done){
				connection = new Sequelize(config.db.database, config.db.username, config.db.password, config.db.options);

				Sequelize.Promise = require('q');
				
				connection.authenticate().then(function(){
					done();
				}, function(err){
					should(err).not.exist();
				});
			});
			it('should be able to query', function(done){
				connection.query('select 1 as value', {type: connection.QueryTypes.SELECT}).then(function(val){
					expect(val[0].value).equals(1);
					done();
				}, function(err){
					should(err).not.exist();
				});
			});
			it('should close connection safely', function(done){
				connection.close().then(function(){
					done();
				});
			});

			after(function(){
			});
		});
	}
})(console);