'use strict';
const request = require('superagent');
const Request = request.Request;
const util = require('./util');
const globals = {
	requesting: 0
};
module.exports = request;



/**
 * [done description]
 * @return {Function} [description]
 */
Request.prototype.done = function done() {
	if (!this._timeout && util.timeout) {
		this.timeout(util.timeout);
	}
	let performance = {
		requestStart: Date.now()
	};
	let commonHeaders = util.getHeaders('common');
	if (commonHeaders) {
		this.set(commonHeaders);
	}
	let methodHeaders = util.getHeaders(this.method);
	if (methodHeaders) {
		this.set(methodHeaders);
	}

	return new Promise((resolve, reject) => {

		// 完成request interceptors时回调
		let doneReqIntcs = () => {
			performance.fetchStart = Date.now();
			performance.requesting = globals.requesting++;

			this.end((err, res) => {
				performance.fetchEnd = Date.now();
				let resIntcs = util.getResIntc().concat(this._resIntcs || []);
				// 完成response interceptors时回调
				let doneResIntcs = () => {
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
				};

				runInterceptors(resIntcs, [res, this], doneResIntcs, reject);
			});
		};

		let reqIntcs = util.getReqIntc().concat(this._reqIntcs || []);
		runInterceptors(reqIntcs, [this], doneReqIntcs, reject);
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