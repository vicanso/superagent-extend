'use strict';
const globalInterceptors = {
	request: [],
	response: []
};
const interceptors = {};
const defaultHeaders = {};

exports.addReqIntc = addReqIntc;
exports.addResIntc = addResIntc;
exports.removeReqIntc = removeReqIntc;
exports.removeResIntc = removeResIntc;
exports.getReqIntc = getReqIntc;
exports.getResIntc = getResIntc;
exports.timeout = 0;
exports.addHeader = addHeader;
exports.removeHeader = removeHeader;
exports.getHeaders = getHeaders;
exports.interceptors = interceptors;

/**
 * [addReqIntc description]
 * @param {Function} fn [description]
 */
function addReqIntc(fn) {
	addInterceptor('request', fn);
}

/**
 * [addResIntc description]
 * @param {Function} fn [description]
 */
function addResIntc(fn) {
	addInterceptor('response', fn);
}

/**
 * [addInterceptor description]
 * @param {[type]}   type [description]
 * @param {Function} fn   [description]
 */
function addInterceptor(type, fn) {
	let arr = globalInterceptors[type];
	if (arr.indexOf(fn) === -1) {
		arr.push(fn);
	}
}

/**
 * [removeReqIntc description]
 * @param  {Function} fn [description]
 * @return {[type]}      [description]
 */
function removeReqIntc(fn) {
	removeInterceptor('request', fn);
}


/**
 * [removeResIntc description]
 * @param  {Function} fn [description]
 * @return {[type]}      [description]
 */
function removeResIntc(fn) {
	removeInterceptor('response', fn);
}

/**
 * [removeInterceptor description]
 * @param  {[type]}   type [description]
 * @param  {Function} fn   [description]
 * @return {[type]}        [description]
 */
function removeInterceptor(type, fn) {
	let arr = globalInterceptors[type];
	if (!fn) {
		arr.length = 0;
		return;
	}
	let index = arr.indexOf(fn);
	arr.splice(index, 1);
}


/**
 * [getReqIntc description]
 * @return {[type]} [description]
 */
function getReqIntc() {
	return globalInterceptors.request.slice(0);
}


/**
 * [getResIntc description]
 * @return {[type]} [description]
 */
function getResIntc() {
	return globalInterceptors.response.slice(0);
}


/**
 * [addHeader description]
 * @param {[type]} method [description]
 * @param {[type]} obj  [description]
 */
function addHeader(method, obj) {
	method = method.toLowerCase();
	let headers = defaultHeaders[method];
	if (!headers) {
		headers = {};
		defaultHeaders[method] = headers;
	}
	let keys = Object.keys(obj);
	keys.forEach(function(k) {
		headers[k.toLowerCase()] = obj[k];
	});
}

/**
 * [removeHeader description]
 * @param  {[type]} method [description]
 * @param  {[type]} key  [description]
 * @return {[type]}      [description]
 */
function removeHeader(method, key) {
	if (!key) {
		defaultHeaders[method] = {};
		return;
	}
	key = key.toLowerCase();
	method = method.toLowerCase();
	let headers = defaultHeaders[method];
	if (headers) {
		delete headers[key];
	}
}

/**
 * [getHeaders description]
 * @param  {[type]} method [description]
 * @return {[type]}      [description]
 */
function getHeaders(method) {
	method = method.toLowerCase();
	return defaultHeaders[method];
}