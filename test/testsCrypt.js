/*
usage: mocha testCrypt.js
*/

/*global describe */
/*global before */
/*global it */
/*global after */
(function(process, logger){
	"use strict";
	const expect = require("chai").expect,
		cryptlib = require("../lib/cryptlib"),
		config = require("../config.json");

	if (typeof describe === "function"){
		describe("Crypt", function(){
			it("should be able to crypt a text and to decrypt in reverse", function(done){
				const crypted = cryptlib.crypt("password", "content");
				expect(cryptlib.decrypt("password", crypted)).equals("content");

				done();
			});
		});
	}
})(process, console);
