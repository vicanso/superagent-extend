'use strict';
const request = require('../lib/superagent');
const co = require('co');
var processing = 0;
var processedTotal = 0;
// set global timeout 5000ms
request.timeout(5000);

// request start event
request.on('request', function (req) {
  processing++;
});

// request complete event
request.on('complete', function (req, res) {
  processing--;
  processedTotal++;
});

// request error event
request.on('error', function (err) {
  console.error(err);
});

// add interceptor before request
request.addRequestInterceptor(function (req) {
  return new Promise(function (resolve, reject) {
    setTimeout(resolve, 1000);
  });
});

// add interceptor before response
request.addResponseInterceptor(function (res) {
  return new Promise(function (resolve, reject) {
    console.dir(res.statusCode);
    setTimeout(resolve, 1000);
  });
});


co(function* () {
  console.time('abcd');
  let res = yield request.get('http://www.baidu.com/').done();
  console.timeEnd('abcd');
}).catch(function (err) {
  console.error(err);
});
