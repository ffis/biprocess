/*global describe */
/*global before */
/*global it */
/*global after */
(function(){
	'use strict';

	var path = require('path'),
		redis = require('redis'),
		chai = require('chai'),
		expect = chai.expect,
		should = chai.should,
		config = require(path.join(__dirname, '..', 'config.json'));

	if (typeof describe === 'function'){
		describe('Redis test', function(){

			var client;
			before(function(){
			});
			it('should be able to connect', function(done){
				client = redis.createClient(config.redis);
				client.on('error', function (err) {
					should(err).not.exist();
				});
				client.on('connect', function() {
					done();
				});
			});
			it('should be able to set values', function(done){
				client.set('string key', 'string val',
					function(err, reply) {
						should(err).not.exist();
						expect(reply).equals('OK');
						done();
					}
				);
			});
			it('should be able to get values', function(done){
				client.get('string key',
					function(err, reply) {
						should(err).not.exist();
						expect(reply).equals('string val');
						done();
					}
				);
			});
			it('should be able to hset values', function(done){
				client.hset('hash key', 'hashtest 1', 'some value', done);
			});
			it('should be able to hset values array', function(done){
				client.hset(['hash key', 'hashtest 2', 'some other value'], done);
			});
			it('should be able to read hkeys values array', function(done){
				client.hkeys('hash key', function (err, replies) {
					should(err).not.exist();
					expect(replies.length).equals(2);
					expect(replies[0]).equals('hashtest 1');
					expect(replies[1]).equals('hashtest 2');
					done();
				});
			});

			after(function(){
				client.quit();
			});
		});
	}
})();
