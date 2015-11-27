"use strict";
const assert = require('assert');
const superagentExtend = require('../index');
const request = superagentExtend.request;
const util = superagentExtend.util;
const noop = function() {};

describe('request', function() {
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

		request.get('http://www.baidu.com.cn').done().then(function(res) {
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

		request.get('http://www.baidu.com.cn').done().then(noop, function(err) {
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

		request.get('http://www.baidu.com.cn').done().then(function(res) {
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

		request.get('http://www.baidu.com.cn').done().then(noop, function(err) {
			assert.equal(err.message, 'timeout');
			util.removeResIntc();
			done();
		});
	});


	it('should set timeout successful', function(done) {
		util.timeout = 1;

		request.get('http://www.baidu.com.cn').done().then(noop, function(err) {
			assert.equal(err.code, 'ECONNABORTED');
			util.timeout = 0;
			done();
		});
	});

	it('should parse http get function successful', function(done) {
		let str = 'get http://www.baidu.com.cn';

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
			assert.equal(res.req.path, '/?b=2&c=1&ch1=%F4%8F%B0%80&ch2=%EE%80%92&d=1&d=2&debug=true&dev=false&e=%0A&name=%E4%B8%AD%E6%96%87&use=');
			assert.equal(res.status, 200);
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
		let fn = superagentExtend.parse('get http://www.baidu.com/ before,:after');
		fn().then(function(res) {
			assert.equal(res.status, 200);
			assert.equal(interceptorCallCount, 2);
			done();
		}, done);
	});

	it('should parse http post function successful', function(done) {
		const http = require('http');
		const getRawBody = require('raw-body');
		const data = {
			name: 'vicanso'
		};
		// Create an HTTP server
		let server = http.createServer(function(req, res) {
			getRawBody(req, function(err, buf) {
				assert.equal(buf.toString(), JSON.stringify(data));
				res.writeHead(200, {
					'Content-Type': 'text/plain'
				});
				res.end('okay');
			});
		});
		server.listen(8080);

		let postFn = superagentExtend.parse('post http://localhost:8080/');
		postFn(data).then(function(res) {
			assert.equal(res.status, 200);
			server.close();
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

		request.get('http://baidu.com').done().then(function(res) {
			assert.equal(res.req._headers[commonKey], commonHeader[commonKey]);
			util.removeHeader('common', commonKey);
			assert(!util.getHeaders('common')[commonKey]);


			assert.equal(res.req._headers[getKey], getHeader[getKey]);
			util.removeHeader('get', getKey);
			assert(!util.getHeaders('get')[getKey]);

			done();
		}, done);
	});

});