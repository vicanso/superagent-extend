'use strict';
const util = require('util');
const EventEmitter = require('events');
const request = require('superagent');
const Request = require('superagent').Request;
const event = new EventEmitter();
const debug = require('debug')('jt.superagent-extend');

const globals = {
  // 默认无timeout
  timeout: 0,
  processing: 0,
  requestInterceptors: [],
  responseInterceptors: []
};
/**
 * [getInterceptors description]
 * @param  {[type]} type [description]
 * @param  {[type]} obj  [description]
 * @return {[type]}      [description]
 */
function getInterceptors(type, obj) {
  let interceptors = globals.requestInterceptors;
  if (type === 'response') {
    interceptors = globals.responseInterceptors;
  }
  if (interceptors && interceptors.length) {
    return interceptors.map(function (fn) {
      return fn(this);
    }.bind(obj));
  }
}

/**
 * [runInterceptors description]
 * @param  {[type]} interceptors [description]
 * @return {[type]}              [description]
 */
function runInterceptors(interceptors, resolve, reject) {
  if (!interceptors || interceptors.length === 0) {
    resolve();
  } else {
    interceptors.shift().then(function () {
      runInterceptors(interceptors, resolve, reject);
    }, reject);
  }
}

/**
 * [done description]
 * @return {[type]}      [description]
 */
Request.prototype.done = function done() {
  // yield runInterceptors('request', this);

  if (util.isUndefined(this._timeout)) {
    this._timeout = globals.timeout;
  }
  globals.processing++;
  event.emit('request', this);
  let req = this;

  // http请求发送
  let doRequest = function (resolve, reject) {
    req.end(function (err, res) {
      globals.processing--;
      res = res || {
        status: -1
      };
      event.emit('complete', req, res);
      if (err) {
        reject(err);
      } else {
        // 获取response interceptors，执行
        let interceptors = getInterceptors('response', res);
        if (!interceptors || !interceptors.length) {
          return resolve(res);
        }
        runInterceptors(interceptors, function () {
          resolve(res);
        }, reject);
      }
    });
  };
  return new Promise(function (resolve, reject) {
    // 获取request interceptors，执行
    let interceptors = getInterceptors('request', req);
    if (!interceptors || !interceptors.length) {
      doRequest(resolve, reject);
      return;
    }
    runInterceptors(interceptors, function () {
      doRequest(resolve, reject);
    }, reject);
  });


  // let res;
  // try {
  //   res = yield new Promise(this.then.bind(this));
  // } catch (err) {
  //   event.emit('error', err, this, res);
  //   throw err;
  // } finally {
  //   globals.processing--;
  //   event.emit('complete', this, res);
  // }
  // yield runInterceptors('response', res);
  // return res;
};

/**
 * [timeout description]
 * @param  {[type]} ms [description]
 * @return {[type]}    [description]
 */
function timeout(ms) {
  debug('set global timeout:%d', ms);
  globals.timeout = ms;
}

/**
 * [addListener description]
 * @param {[type]} type     [description]
 * @param {[type]} listener [description]
 */
function addListener(type, listener) {
  event.addListener(type, listener);
}

/**
 * [removeListener description]
 * @param  {[type]} type     [description]
 * @param  {[type]} listener [description]
 * @return {[type]}          [description]
 */
function removeListener(type, listener) {
  event.removeListener(type, listener);
}


/**
 * [addInterceptor description]
 * @param {[type]}   type [description]
 * @param {Function} fn   [description]
 */
function addInterceptor(type, fn) {
  let interceptors = globals.requestInterceptors;
  if (type === 'response') {
    interceptors = globals.responseInterceptors;
  }
  if (interceptors.indexOf(fn) === -1) {
    interceptors.push(fn);
  }
}

/**
 * [removeInterceptor description]
 * @param  {[type]}   type [description]
 * @param  {Function} fn   [description]
 * @return {[type]}        [description]
 */
function removeInterceptor(type, fn) {
  let interceptors = globals.requestInterceptors;
  if (type === 'response') {
    interceptors = globals.responseInterceptors;
  }
  if (!fn) {
    interceptors.length = 0;
  } else {
    let index = interceptors.indexOf(fn);
    if (index !== -1) {
      interceptors.splice(index);
    }
  }
}


request.on = request.addListener = addListener;

request.removeListener = removeListener;

request.timeout = timeout;

request.addInterceptor = addInterceptor;

request.removeInterceptor = removeInterceptor;

module.exports = request;
