/*
usage: mocha testCrypt.js
*/

/*global describe */
/*global before */
/*global it */
/*global after */
(function(process, logger){
	'use strict';
	const expect = require('chai').expect,
		cryptlib = require('../lib/cryptlib'),
		config = require('../config.json');

	if (typeof describe === 'function'){
		describe('Crypt', function(){

			before(function(){
				
			});

			it('should be able to crypt a text', function(done){
				
				const crypted = cryptlib.crypt('password', 'password');
				logger.log(crypted, typeof crypted);
				done();

			});

			after(function(){

			});

		});
	}
})(process, console);
