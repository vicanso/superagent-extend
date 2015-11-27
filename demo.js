'use strict';
const request = require('./index').request;
const assert = require('assert');
request('http://www.baidu.com/').done().then(function(res) {
	assert.equal(res.status, 200);
	console.info(JSON.stringify(res.performance));
}, function(err) {
	console.error(err);
});