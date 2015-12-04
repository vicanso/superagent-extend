'use strict';
const request = require('./lib/request');
const util = require('./lib/util');
const querystring = require('./lib/querystring');
exports.request = request;
exports.util = util;
exports.parse = parse;


/**
 * [parse description]
 * @param  {[type]} str 'method url interceptors'
 * @return {[type]}     [description]
 */
function parse(str) {
	let arr = str.split(' ');
	if (arr.length < 2) {
		throw new Error('request description is invalid');
	}
	let method = arr[0].toLowerCase();
	/* istanbul ignore if */
	if (method === 'delete') {
		method = 'del';
	}
	let url = arr[1];
	let reqIntcs = [];
	let resIntcs = [];
	if (arr[2]) {
		let fns = arr[2].split(',');
		fns.forEach(function(fn) {
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

	return function(data, headers) {
		if (method === 'get' || method === 'del') {
			let queryStr = querystring.stringify(data);
			if (queryStr) {
				url += ('?' + queryStr);
			}
		}
		let req = request[method](url);
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