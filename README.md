# extend superagent

## Installation

```bash
$ npm install superagent-extend
```

## API

### addListener

add event listener for all http request

```js
const request = require('superagent-extend');
const co = require('co');
request.addListener('request', function(req) {
  console.dir(req);
});
request.addListener('complete', function(req, res) {
  console.dir(res);
});
request.addListener('error', function(err, req, res) {
  console.error(err);
});
co(function *() {
  let res = yield request.get('http://www.baidu.com/').done();
}).catch(function(err) {
  console.error(err);
});
```

### removeListener

remove event listener


### timeout

set default timeout for all http request

```js
const request = require('superagent-extend');
request.timeout(5000);
```


### addInterceptor

add interceptor for before request or before response


```js
const request = require('superagent-extend');
const co = require('co');

// add interceptor before request
request.addRequestInterceptor(function (req) {
  return new Promise(function (resolve, reject) {
    setTimeout(resolve, 1000);
  });
});

// add interceptor before response
request.addResponseInterceptor(function (res) {
  return new Promise(function (resolve, reject) {
    setTimeout(resolve, 1000);
  });
});

co(function *() {
  let res = yield request.get('http://www.baidu.com/').done();
}).catch(function(err) {
  console.error(err);
});
```


### removeInterceptor

remove interceptor


## License

MIT
