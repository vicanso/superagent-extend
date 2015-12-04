"use strict";
const assert = require('assert');
const superagentExtend = require('../index');
const request = superagentExtend.request;
const util = superagentExtend.util;
const noop = function() {};

describe('request', function() {
	request.Request.prototype.end = function(cb) {
		const timeout = this._timeout;
		const req = this.request();
		req._qs = this.qs;
		let isTimeout = false;
		let timer = null;
		setTimeout(function() {
			if (isTimeout) {
				return;
			}
			clearTimeout(timer);
			cb(null, {
				status: 200,
				emit: function() {},
				req: req
			});
		}, 100);
		if (timeout) {
			timer = setTimeout(function() {
				let err = new Error('ECONNABORTED');
				err.code = 'ECONNABORTED';
				cb(err);
				isTimeout = true;
			}, timeout);
		};
	};

	it('should add before interceptor successful', function(done) {
		let interceptorCallCount = 0;
		let interval = 1000;

		util.addReqIntc(function(req) {
			interceptorCallCount++;
		});

		util.addReqIntc(function(req) {
			return new Promise(function(resolve, reject) {
				setTimeout(function() {
					interceptorCallCount++;
					resolve();
				}, interval);
			});
		});

		request.get('http://vicanso.com').done().then(function(res) {
			util.removeReqIntc();
			let performance = res.performance;
			assert.equal(performance.use > interval, true);
			assert(performance.fetchStart - performance.requestStart >= 1000)
			assert.equal(res.performance.requesting, 0);
			assert.equal(interceptorCallCount, 2);
			done();
		}, done);
	});


	it('should throw request interceptor error successful', function(done) {
		util.addReqIntc(function(req) {
			return new Promise(function(resolve, reject) {
				setTimeout(function() {
					reject(new Error('timeout'));
				}, 100);
			});
		});

		request.get('http://vicanso.com').done().then(noop, function(err) {
			assert.equal(err.message, 'timeout');
			util.removeReqIntc();
			done();
		});
	});

	it('should add after interceptor successful', function(done) {
		let interceptorCallCount = 0;
		let interval = 1000;
		let fn = function(res) {
			interceptorCallCount++;
		};
		util.addResIntc(fn);
		util.addResIntc(function(res) {
			return new Promise(function(resolve, reject) {
				interceptorCallCount++;
				setTimeout(resolve, interval);
			});
		});

		request.get('http://vicanso.com').done().then(function(res) {
			util.removeResIntc(fn);
			assert.equal(util.getResIntc().length, 1);
			let performance = res.performance;
			assert(performance.requestEnd - performance.fetchEnd >= interval);
			assert.equal(interceptorCallCount, 2);
			util.removeResIntc();
			done();
		}, done);
	});


	it('should throw response interceptor error successful', function(done) {
		util.addResIntc(function(res) {
			return new Promise(function(resolve, reject) {
				setTimeout(function() {
					reject(new Error('timeout'));
				}, 100);
			});
		});

		request.get('http://vicanso.com').done().then(noop, function(err) {
			assert.equal(err.message, 'timeout');
			util.removeResIntc();
			done();
		});
	});


	it('should set timeout successful', function(done) {
		util.timeout = 1;

		request.get('http://vicanso.com').done().then(noop, function(err) {
			assert.equal(err.code, 'ECONNABORTED');
			util.timeout = 0;
			done();
		});
	});

	it('should parse http get function successful', function(done) {
		let str = 'get http://vicanso.com';

		try {
			superagentExtend.parse('get');
		} catch (err) {
			assert.equal(err.message, 'request description is invalid');
		}

		let fn = superagentExtend.parse(str);
		fn({
			d: [1, 2],
			c: 1,
			name: '中文',
			debug: true,
			dev: false,
			use: '',
			ch1: String.fromCharCode(0xdfff),
			ch2: String.fromCharCode(0xE012),
			e: '\n',
			b: 2
		}, {
			UUID: Date.now()
		}).then(function(res) {
			assert.equal(Object.keys(res.req._qs).join(','), ['b', 'c', 'ch1', 'ch2', 'd', 'debug', 'dev', 'e', 'name', 'use'].join(','));
			assert.equal(res.status, 200);
			done();
		}, done);

	});

	it('should add interceptor for request successful', function(done) {
		let interceptorCallCount = 0;
		let url = 'http://www.baidu.com/';
		let req = request.get(url);
		req.addReqIntc(function(req) {
			assert.equal(req.url, url);
			interceptorCallCount++;
		});
		req.addResIntc(function(res) {
			assert.equal(res.status, 200);
			interceptorCallCount++;
		});
		req.done().then(function(res) {
			assert.equal(interceptorCallCount, 2);
			done();
		}, done);
	});


	it('should parse function include interceptor successful', function(done) {
		let interceptorCallCount = 0;
		util.interceptors.before = function(req) {
			interceptorCallCount++;
		};
		util.interceptors.after = function(res) {
			interceptorCallCount++;
		};
		let fn = superagentExtend.parse('GET http://www.baidu.com/ before,:after');
		fn().then(function(res) {
			assert.equal(res.status, 200);
			assert.equal(interceptorCallCount, 2);
			done();
		}, done);
	});

	it('should parse http post function successful', function(done) {

		let postFn = superagentExtend.parse('POST http://localhost:8080/');
		postFn({
			name: 'vicanso'
		}).then(function(res) {
			assert.equal(res.status, 200);
			done();
		}, done);
	});


	it('should set header successful', function(done) {
		let commonKey = 'uuid';
		let commonHeader = {};
		commonHeader[commonKey] = 'ABCD';
		util.addHeader('common', commonHeader);

		let getKey = 'guuid';
		let getHeader = {};
		getHeader[getKey] = 'DEF';
		util.addHeader('get', getHeader);

		request.get('http://www.baidu.com/').done().then(function(res) {
			assert.equal(res.req._headers[commonKey], commonHeader[commonKey]);
			util.removeHeader('common', commonKey);
			assert(!util.getHeaders('common')[commonKey]);


			assert.equal(res.req._headers[getKey], getHeader[getKey]);
			util.removeHeader('get');
			assert.equal(Object.keys(util.getHeaders('get')).length, 0);

			done();
		}, done);
	});

});