"use strict";
const assert = require('assert');
const superagentExtend = require('../index');
const request = superagentExtend.request;
const util = superagentExtend.util;
const Koa = require('koa');
const noop = function() {};

describe('request', function() {
	const app = new Koa();
	const server = app.listen();
	const address = server.address();
	util.addReqIntc(req => {
		req.url = 'http://localhost:' + address.port + req.url;
	});

	app.use(ctx => {
		return new Promise((resolve) => {
			setTimeout(() => {
				ctx.body = ctx.url;
				resolve();
			}, 100);
		});
	});

	it('should add before interceptor successful', done => {
		let interceptorCallCount = 0;
		const interval = 1000;

		const fn1 = (req) => {
			interceptorCallCount++;
		};

		const fn2 = (req) => {
			return new Promise(function(resolve, reject) {
				setTimeout(function() {
					interceptorCallCount++;
					resolve();
				}, interval);
			});
		};

		util.addReqIntc(fn1, fn2);


		request.get('/').done().then(function(res) {
			const performance = res.performance;
			assert.equal(performance.use > interval, true);
			assert(performance.fetchStart - performance.requestStart >= 1000)
			assert.equal(res.performance.requesting, 0);
			assert.equal(interceptorCallCount, 2);
			util.removeReqIntc(fn1, fn2);
			done();
		}, done);
	});


	it('should throw request interceptor error successful', done => {
		const fn = (req) => {
			return new Promise(function(resolve, reject) {
				setTimeout(function() {
					reject(new Error('timeout'));
				}, 100);
			});
		};
		util.addResIntc(fn);

		request.get('/').done().then(noop, function(err) {
			assert.equal(err.message, 'timeout');

			util.removeResIntc(fn);

			done();
		});
	});


	it('should add after interceptor successful', function(done) {
		let interceptorCallCount = 0;
		let interval = 1000;
		const fn1 = function(res) {
			interceptorCallCount++;
		};
		const fn2 = (res) => {
			return new Promise(function(resolve, reject) {
				interceptorCallCount++;
				setTimeout(resolve, interval);
			});
		};

		util.addResIntc(fn1, fn2);

		request.get('/').done().then(function(res) {
			util.removeResIntc(fn1);
			assert.equal(util.getResIntc().length, 1);
			let performance = res.performance;
			assert(performance.requestEnd - performance.fetchEnd >= interval);
			assert.equal(interceptorCallCount, 2);
			util.removeResIntc(fn2);
			done();
		}, done);
	});


	it('should throw response interceptor error successful', function(done) {
		const fn = function(res) {
			return new Promise(function(resolve, reject) {
				setTimeout(function() {
					reject(new Error('timeout'));
				}, 100);
			});
		};
		util.addResIntc(fn);

		request.get('/').done().then(noop, function(err) {
			assert.equal(err.message, 'timeout');
			util.removeResIntc(fn);
			done();
		});
	});

	it('should set timeout successful', function(done) {
		util.timeout = 10;

		request.get('/').done().then(noop, function(err) {
			assert.equal(err.code, 'ECONNABORTED');
			util.timeout = 0;
			done();
		});
	});


	it('should parse http get function successful', function(done) {
		let str = 'get /';
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

});