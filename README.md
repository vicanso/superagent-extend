# extend superagent

## Installation

```bash
$ npm install superagent-extend
```

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
- `performance.requestStart` the timestamp of request start, before request interceptors execute
.

- `performance.fetchStart` the timestamp of fetch start, after request interceptors execute end.

- `performance.fetchEnd` the timestamp of fetch end, before response interceptors execute.

- `performance.requestEnd` the timestamp of request end, after response interceptors execute end.

- `performance.use` time consuming of request(requestEnd - requestStart)

- `performance.requesting` when fetch start, the requesting count


## License

MIT
