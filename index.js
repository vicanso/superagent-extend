'use strict';
const request = require('./lib/request');
const util = require('./lib/util');
const querystring = require('./lib/querystring');
const pathToRegexp = require('path-to-regexp');
exports.request = request;
exports.util = util;
exports.parse = parse;


/**
 * [parse description]
 * @param  {[type]} str 'method url interceptors'
 * @return {[type]}     [description]
 */
function parse(str) {
	const arr = str.split(' ');
	if (arr.length < 2) {
		throw new Error('request description is invalid');
	}
	let method = arr[0].toLowerCase();
	/* istanbul ignore if */
	if (method === 'delete') {
		method = 'del';
	}
	let url = arr[1];
	const paramKeys = pathToRegexp(url).keys;
	const reqIntcs = [];
	const resIntcs = [];
	if (arr[2]) {
		arr[2].split(',').forEach(function(fn) {
			if (fn.charAt(0) === ':') {
				let intc = util.interceptors[fn.substring(1)];
				/* istanbul ingore else */
				if (intc) {
					resIntcs.push(intc);
				}
			} else {
				let intc = util.interceptors[fn];
				/* istanbul ingore else */
				if (intc) {
					reqIntcs.push(intc);
				}
			}
		});
	}

	return function() {
		const args = Array.from(arguments);
		let cloneUrl = url;
		paramKeys.forEach(key => {
			cloneUrl = cloneUrl.replace(':' + key.name, args.shift());
		});
		const data = args[0];
		const headers = args[1];
		if (method === 'get' || method === 'del') {
			let queryStr = querystring.stringify(data);
			if (queryStr) {
				cloneUrl += ('?' + queryStr);
			}
		}
		let req = request[method](cloneUrl);
		if (method === 'post' || method === 'put') {
			req.send(data);
		}
		if (headers) {
			req.set(headers);
		}
		reqIntcs.forEach(function(intc) {
			req.addReqIntc(intc);
		});
		resIntcs.forEach(function(intc) {
			req.addResIntc(intc);
		});
		return req.done();
	};
}