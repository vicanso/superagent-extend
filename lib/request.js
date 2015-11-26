'use strict';
const request = require('superagent');
const Request = request.Request;
const ex = require('./ex');
const globals = {
	requesting: 0
};
request.trans = trans;
module.exports = request;

/**
 * [trans description]
 * @param  {[type]} str 'method url interceptors'
 * @return {[type]}     [description]
 */
function trans(str) {
	let arr = str.split(' ');
	if (arr.length < 2) {
		throw new Error('request description is invalid!');
	}
	let method = arr[0].toLowerCase();
	let url = arr[1];

	return function(query, header) {
		return request.get(url).done();
	};

	// if (method === 'GET') {
	// 	return function(query, header) {
	// 		return request.get(url).done();
	// 	}
	// }
}


/**
 * [done description]
 * @return {Function} [description]
 */
Request.prototype.done = function done() {
	if (!this._timeout && ex.timeout) {
		this.timeout(ex.timeout);
	}
	let performance = {
		requestStart: Date.now()
	};
	return new Promise((resolve, reject) => {
		runInterceptors(ex.getReqIntc(), [this], () => {
			performance.fetchStart = Date.now();
			performance.requesting = globals.requesting++;
			this.end((err, res) => {
				performance.fetchEnd = Date.now();
				runInterceptors(ex.getResIntc(), [res, this], () => {
					res = res || {
						status: -1
					};
					let now = Date.now();
					performance.requestEnd = now;
					performance.use = now - performance.requestStart;
					res.performance = performance;
					if (err) {
						reject(err);
					} else {
						resolve(res);
					}
				}, reject);
			});
		}, reject);
	});
};



/**
 * [runInterceptors description]
 * @param  {[type]} interceptors [description]
 * @param  {[type]} args         [description]
 * @param  {[type]} resolve      [description]
 * @param  {[type]} reject       [description]
 * @return {[type]}              [description]
 */
function runInterceptors(interceptors, args, resolve, reject) {
	if (!interceptors || interceptors.length === 0) {
		resolve();
	} else {
		let fn = interceptors.shift();
		/*jshint validthis:true */
		let result = fn.apply(null, args);
		if (result && result.then) {
			result.then(() => {
				runInterceptors(interceptors, args, resolve, reject);
			}, reject);
		} else {
			runInterceptors(interceptors, args, resolve, reject);
		}
	}
}