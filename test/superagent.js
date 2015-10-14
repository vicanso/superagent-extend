"use strict";
const assert = require('assert');
const koa = require('koa');
const request = require('../lib/superagent');
const http = require('http');
const co = require('co');
const router = require('koa-router')();

describe('request', function (argument) {
  let app = koa();

  router.get('/', function () {
    this.body = 'OK';
  });

  app.use(function* (next) {
    yield new Promise(function (resolve, reject) {
      setTimeout(resolve, 500);
    });
    yield next;
  });
  app.use(router.routes());
  let port = process.env.PORT || 10000;
  let httpServer = http.createServer(app.callback()).listen(port);
  let requestUrl = 'http://localhost:' + port + '/';
  request.on('request', function () {});
  it('should set global timeout successful', function (done) {
    request.timeout(100);
    co(function* () {
      try {
        let res = yield request.get(requestUrl).done();
      } catch (err) {
        assert.equal(err.code, 'ECONNRESET');
      } finally {
        request.timeout(0);
        done()
      }
    });
  });

  it('should add request interceptor successful', function (done) {
    co(function* () {
      let success = false;
      let interceptor = function (req) {
        return new Promise(function (resolve, reject) {
          success = true;
          setTimeout(resolve, 1);
        });
      };
      request.addInterceptor('request', interceptor);
      let res = yield request.get(requestUrl).done();
      assert(success);
      request.removeInterceptor('request', interceptor);
      done();
    });
  });


  it('should add response interceptor successful', function (done) {
    co(function* () {
      let success = false;
      let interceptor = function (req) {
        return new Promise(function (resolve, reject) {
          success = true;
          setTimeout(resolve, 1);
        });
      };
      request.addInterceptor('response', interceptor);
      let res = yield request.get(requestUrl).done();
      assert(success);
      request.removeInterceptor('response', interceptor);
      done();
    });
  });

  it('should request successful', function (done) {
    co(function* () {
      let res = yield request.get(requestUrl).done();
      assert(res.status === 200);
      done();
      httpServer.close()
    });
  });
});
