"use strict";
const assert = require('assert');
const request = require('../lib/request');
const ex = require('../lib/ex');
const noop = function() {};

describe('request', function() {
	it('should add before interceptor successful', function(done) {
		let interceptorCallCount = 0;
		let interval = 1000;

		ex.addReqIntc(function(req) {
			interceptorCallCount++;
		});

		ex.addReqIntc(function(req) {
			return new Promise(function(resolve, reject) {
				setTimeout(function() {
					interceptorCallCount++;
					resolve();
				}, interval);
			});
		});

		request.get('http://www.baidu.com.cn').done().then(function(res) {
			ex.removeReqIntc();
			let performance = res.performance;
			assert.equal(performance.use > interval, true);
			assert(performance.fetchStart - performance.requestStart >= 1000)
			assert.equal(res.performance.requesting, 0);
			assert.equal(interceptorCallCount, 2);

			done();
		}, done);
	});


	it('should throw request interceptor error successful', function(done) {
		ex.addReqIntc(function(req) {
			return new Promise(function(resolve, reject) {
				setTimeout(function() {
					reject(new Error('timeout'));
				}, 100);
			});
		});

		request.get('http://www.baidu.com.cn').done().then(noop, function(err) {
			assert.equal(err.message, 'timeout');
			ex.removeReqIntc();
			done();
		});
	});

	it('should add after interceptor successful', function(done) {
		let interceptorCallCount = 0;
		let interval = 1000;
		let fn = function(res) {
			interceptorCallCount++;
		};
		ex.addResIntc(fn);
		ex.addResIntc(function(res) {
			return new Promise(function(resolve, reject) {
				interceptorCallCount++;
				setTimeout(resolve, interval);
			});
		});

		request.get('http://www.baidu.com.cn').done().then(function(res) {
			ex.removeResIntc(fn);
			assert.equal(ex.getResIntc().length, 1);
			let performance = res.performance;
			assert(performance.requestEnd - performance.fetchEnd >= interval);
			assert.equal(interceptorCallCount, 2);
			ex.removeResIntc();
			done();
		}, done);
	});


	it('should throw response interceptor error successful', function(done) {
		ex.addResIntc(function(res) {
			return new Promise(function(resolve, reject) {
				setTimeout(function() {
					reject(new Error('timeout'));
				}, 100);
			});
		});

		request.get('http://www.baidu.com.cn').done().then(noop, function(err) {
			assert.equal(err.message, 'timeout');
			ex.removeResIntc();
			done();
		});
	});


	it('should set timeout successful', function(done) {
		ex.timeout = 1;

		request.get('http://www.baidu.com.cn').done().then(noop, function(err) {
			assert.equal(err.code, 'ECONNABORTED');
			ex.timeout = 0;
			done();
		});
	});

	it('should trans function successful', function(done) {
		let str = 'get http://www.baidu.com.cn';
		let fn = request.trans(str);
		fn().then(function(res) {
			assert.equal(res.status, 200);
		}, done);
	});

});



// 	it('should add after interceptor successful', function(done) {
// 		let interceptorCallCount = 0;

// 		request.after(function(res) {
// 			console.dir(res);
// 			interceptorCallCount++;
// 		});


// 		request.get('http://www.baidu.com.cn').done().then(function(res) {
// 			request.off();
// 			assert.equal(interceptorCallCount, 2);
// 			done();
// 		}, function(err) {
// 			done(err);
// 		});

// 	});
// });

// describe('request', function(argument) {
//  let app = koa();
//  let noop = function() {};
//  router.get('/', function() {
//    this.body = 'OK';
//  });

//  app.use(function*(next) {
//    yield new Promise(function(resolve, reject) {
//      setTimeout(resolve, 500);
//    });
//    yield next;
//  });
//  app.use(router.routes());
//  let port = process.env.PORT || 10000;
//  let httpServer = http.createServer(app.callback()).listen(port);
//  let requestUrl = 'http://localhost:' + port + '/';

//  it('should add listener successful', function(done) {
//    let success = false;
//    let fn = function() {
//      success = true;
//    };
//    request.addListener('request', fn);
//    request.get(requestUrl).done().then(function() {
//      assert(success);
//      request.removeListener('request', fn);
//      done();
//    });
//  });



//  it('should set global timeout successful', function(done) {
//    request.timeout(100);
//    request.get(requestUrl).done().then(noop, function(err) {
//      assert.equal(err.code, 'ECONNABORTED');
//      request.timeout(0);
//      done();
//    });
//  });



//  it('should add request interceptor successful', function(done) {
//    let success = false;
//    let interceptor = function(req) {
//      return new Promise(function(resolve, reject) {
//        success = true;
//        setTimeout(resolve, 1);
//      });
//    };
//    request.addInterceptor('request', interceptor);
//    request.get(requestUrl).done().then(function() {
//      assert(success);
//      request.removeInterceptor('request', interceptor);
//      done();
//    });
//  });



//  it('should add response interceptor successful', function(done) {
//    let success = false;
//    let interceptor = function(req) {
//      return new Promise(function(resolve, reject) {
//        success = true;
//        setTimeout(resolve, 1);
//      });
//    };
//    request.addInterceptor('response', interceptor);
//    request.get(requestUrl).done().then(function() {
//      assert(success);
//      request.removeInterceptor('response', interceptor);
//      request.removeInterceptor('response');
//      done();
//    });
//  });



//  it('should request successful', function(done) {
//    request.get(requestUrl).done().then(function(res) {
//      assert(res.status === 200);
//      done();
//      httpServer.close()
//    });
//  });
// });