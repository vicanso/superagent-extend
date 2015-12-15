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
	const performance = {
		requestStart: Date.now()
	};

	return new Promise((resolve, reject) => {

		// 完成request interceptors时回调
		const doneReqIntcs = () => {

			const commonHeaders = util.getHeaders('common');
			if (commonHeaders) {
				this.set(commonHeaders);
			}
			const methodHeaders = util.getHeaders(this.method);
			if (methodHeaders) {
				this.set(methodHeaders);
			}

			performance.fetchStart = Date.now();
			performance.requesting = globals.requesting++;
			this.end((err, res) => {
				/* istanbul ignore if */
				if (err) {
					reject(err);
					return;
				}
				res.performance = performance;

				performance.fetchEnd = Date.now();
				const resIntcs = util.getResIntc().concat(this._resIntcs || []);
				// 完成response interceptors时回调
				const doneResIntcs = (err) => {

					const now = Date.now();
					performance.requestEnd = now;
					performance.use = now - performance.requestStart;
					/* istanbul ignore if */
					if (err) {
						reject(err);
					} else {
						resolve(res);
					}
				};

				runInterceptors(resIntcs, [res, this], doneResIntcs, reject);
			});
		};

		const reqIntcs = util.getReqIntc().concat(this._reqIntcs || []);
		runInterceptors(reqIntcs, [this], doneReqIntcs, reject);
	});
};

/**
 * [addReqIntc description]
 * @param {Function} fn [description]
 */
Request.prototype.addReqIntc = function(fn) {
	/* istanbul ignore else */
	if (!this._reqIntcs) {
		this._reqIntcs = [];
	}
	/* istanbul ignore else */
	if (this._reqIntcs.indexOf(fn) === -1) {
		this._reqIntcs.push(fn);
	}
	return this;
};

/**
 * [addResIntc description]
 * @param {Function} fn [description]
 */
Request.prototype.addResIntc = function(fn) {
	/* istanbul ignore else */
	if (!this._resIntcs) {
		this._resIntcs = [];
	}
	/* istanbul ignore else */
	if (this._resIntcs.indexOf(fn) === -1) {
		this._resIntcs.push(fn);
	}
	return this;
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
		const fn = interceptors.shift();
		/*jshint validthis:true */
		const result = fn.apply(null, args);
		if (result && result.then) {
			result.then(() => {
				runInterceptors(interceptors, args, resolve, reject);
			}, reject);
		} else {
			runInterceptors(interceptors, args, resolve, reject);
		}
	}
}