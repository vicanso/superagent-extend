# extend superagent

## Installation

```bash
$ npm install superagent-extend
```

### Execute sequence

request interceptors --> fetch start --> fetch end --> response interceptors --> response

## API

### done

return promise wrap request end

```js
'use strict';
const request = require('superagent-extend').request;
const assert = require('assert');
request('http://www.baidu.com/').done().then(function(res) {
  assert.equal(res.status, 200);
  // {"requestStart":1448633071310,"fetchStart":1448633071310,"requesting":0,"fetchEnd":1448633071356,"requestEnd":1448633071356,"use":46}
  console.info(JSON.stringify(res.performance));
}, function(err) {
  console.error(err);
});
```

res.performance:

- `performance.requestStart` the timestamp of request start, before request interceptors execute
.

- `performance.fetchStart` the timestamp of fetch start, after request interceptors execute end.

- `performance.fetchEnd` the timestamp of fetch end, before response interceptors execute.

- `performance.requestEnd` the timestamp of request end, after response interceptors execute end.

- `performance.use` time consuming of request(requestEnd - requestStart)

- `performance.requesting` when fetch start, the requesting count



### addReqIntc

Add request interceptor. After all request interceptors execute end, the request start fetch.

If interceptor function return promise, it will be execute sequence.

Demo execute sequence is: logIn --> addQuery --> fetch start --> fetch end --> response

```js
'use strict';
const superagentExtend = require('superagent-extend');
const request = superagentExtend.request;
const seUtil = superagentExtend.util;
const assert = require('assert');

// promise request interceptor
seUtil.addReqIntc(function logIn(req) {
  return new Promise(function(resolve, reject) {
    setTimeout(resolve, 1000);
  });
});

// normal request interceptor
seUtil.addReqIntc(function addQuery(req) {
  req.url += '?name=vicanso';
});

request('http://www.baidu.com/').done().then(function(res) {
  assert.equal(res.req.path, '/?name=vicanso');
  assert.equal(res.status, 200);
}, function(err) {
  console.error(err);
});
```

### removeReqIntc

Remove request interceptor.

```js
'use strict';
const superagentExtend = require('superagent-extend');
const request = superagentExtend.request;
const seUtil = superagentExtend.util;
const assert = require('assert');

const loginInterceptor = function(req) {
  req.uuid = 'ABCD';
};

seUtil.addReqIntc(loginInterceptor);

// remove request interceptor
seUtil.removeReqIntc(loginInterceptor);

// remove all request interceptor
seUtil.removeReqIntc();
```

### addResIntc

Add response interceptor. After all response interceptors execute end, the response start.

If interceptor function return promise, it will be execute sequence.

Demo execute sequence is: fetch start --> fetch end --> logLongRequest --> response

```js
'use strict';
const superagentExtend = require('superagent-extend');
const request = superagentExtend.request;
const seUtil = superagentExtend.util;
const assert = require('assert');

seUtil.addResIntc(function logMaxRes(res) {
  let length = res.text.length;
  if (length > 5 * 1024) {
    console.info('response data max than 5KB');
  }
});

request('http://www.baidu.com/').done().then(function(res) {
  assert.equal(res.status, 200);
}, function(err) {
  console.error(err);
});
```

### removeResIntc

Remove response interceptor.


```js
'use strict';
const superagentExtend = require('superagent-extend');
const request = superagentExtend.request;
const seUtil = superagentExtend.util;
const assert = require('assert');

const logMaxRes = function(res) {
  let length = res.text.length;
  if (length > 5 * 1024) {
    console.info('response data max than 5KB');
  }
};
seUtil.addResIntc(logMaxRes);

// remove response interceptor
seUtil.removeResIntc(logMaxRes);

// remove all response interceptor
seUtil.removeResIntc();


request('http://www.baidu.com/').done().then(function(res) {
  assert.equal(res.status, 200);
}, function(err) {
  console.error(err);
});
```

### timeout

set timeout, default 0(no timeout).

```js
'use strict';
const superagentExtend = require('superagent-extend');
const request = superagentExtend.request;
const seUtil = superagentExtend.util;
const assert = require('assert');

seUtil.timeout = 1;

request('http://www.baidu.com/').done().then(function(res) {
  assert.equal(res.status, 200);
}, function(err) {
  console.error(err);
});
```




## License

MIT
