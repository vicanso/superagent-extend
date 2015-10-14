"use strict";
const assert = require('assert');
const koa = require('koa');
const request = require('../lib/superagent');
const http = require('http');
const co = require('co');
const router = require('koa-router')();

describe('request', function (argument) {
  let app = koa();
  let noop = function () {};
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

  it('should add listener successful', function (done) {
    let success = false;
    let fn = function () {
      success = true;
    };
    request.addListener('request', fn);
    request.get(requestUrl).done().then(function () {
      assert(success);
      request.removeListener('request', fn);
      done();
    });
  });



  it('should set global timeout successful', function (done) {
    request.timeout(100);
    request.get(requestUrl).done().then(noop, function (err) {
      assert.equal(err.code, 'ECONNABORTED');
      request.timeout(0);
      done();
    });
  });



  it('should add request interceptor successful', function (done) {
    let success = false;
    let interceptor = function (req) {
      return new Promise(function (resolve, reject) {
        success = true;
        setTimeout(resolve, 1);
      });
    };
    request.addInterceptor('request', interceptor);
    request.get(requestUrl).done().then(function () {
      assert(success);
      request.removeInterceptor('request', interceptor);
      done();
    });
  });



  it('should add response interceptor successful', function (done) {
    let success = false;
    let interceptor = function (req) {
      return new Promise(function (resolve, reject) {
        success = true;
        setTimeout(resolve, 1);
      });
    };
    request.addInterceptor('response', interceptor);
    request.get(requestUrl).done().then(function () {
      assert(success);
      request.removeInterceptor('response', interceptor);
      request.removeInterceptor('response');
      done();
    });
  });



  it('should request successful', function (done) {
    request.get(requestUrl).done().then(function (res) {
      assert(res.status === 200);
      done();
      httpServer.close()
    });
  });
});
