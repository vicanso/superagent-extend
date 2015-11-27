'use strict';
const QueryString = exports;

QueryString.stringify = QueryString.encode = function(obj, sep, eq, options) {
	sep = sep || '&';
	eq = eq || '=';

	var encode = QueryString.escape;
	/* istanbul ignore if */
	if (options && typeof options.encodeURIComponent === 'function') {
		encode = options.encodeURIComponent;
	}

	if (obj !== null && typeof obj === 'object') {
		var keys = Object.keys(obj).sort();
		var len = keys.length;
		var flast = len - 1;
		var fields = '';
		for (var i = 0; i < len; ++i) {
			var k = keys[i];
			var v = obj[k];
			var ks = encode(stringifyPrimitive(k)) + eq;

			if (Array.isArray(v)) {
				var vlen = v.length;
				var vlast = vlen - 1;
				for (var j = 0; j < vlen; ++j) {
					fields += ks + encode(stringifyPrimitive(v[j]));
					if (j < vlast)
						fields += sep;
				}
				if (vlen && i < flast)
					fields += sep;
			} else {
				fields += ks + encode(stringifyPrimitive(v));
				if (i < flast)
					fields += sep;
			}
		}
		return fields;
	}
	/* istanbul ignore next */
	return '';
};



var hexTable = new Array(256);
for (var i = 0; i < 256; ++i)
	hexTable[i] = '%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase();
QueryString.escape = function(str) {
	// replaces encodeURIComponent
	// http://www.ecma-international.org/ecma-262/5.1/#sec-15.1.3.4
	str = '' + str;
	var len = str.length;
	var out = '';
	var i, c;

	if (len === 0)
		return str;

	for (i = 0; i < len; ++i) {
		c = str.charCodeAt(i);

		// These characters do not need escaping (in order):
		// ! - . _ ~
		// ' ( ) *
		// digits
		// alpha (uppercase)
		// alpha (lowercase)
		if (c === 0x21 || c === 0x2D || c === 0x2E || c === 0x5F || c === 0x7E ||
			(c >= 0x27 && c <= 0x2A) ||
			(c >= 0x30 && c <= 0x39) ||
			(c >= 0x41 && c <= 0x5A) ||
			(c >= 0x61 && c <= 0x7A)) {
			out += str[i];
			continue;
		}

		// Other ASCII characters
		if (c < 0x80) {
			out += hexTable[c];
			continue;
		}

		// Multi-byte characters ...
		/* istanbul ignore next */
		if (c < 0x800) {
			out += hexTable[0xC0 | (c >> 6)] + hexTable[0x80 | (c & 0x3F)];
			continue;
		}
		if (c < 0xD800 || c >= 0xE000) {
			out += hexTable[0xE0 | (c >> 12)] +
				hexTable[0x80 | ((c >> 6) & 0x3F)] +
				hexTable[0x80 | (c & 0x3F)];
			continue;
		}
		// Surrogate pair
		++i;
		c = 0x10000 + (((c & 0x3FF) << 10) | (str.charCodeAt(i) & 0x3FF));
		out += hexTable[0xF0 | (c >> 18)] +
			hexTable[0x80 | ((c >> 12) & 0x3F)] +
			hexTable[0x80 | ((c >> 6) & 0x3F)] +
			hexTable[0x80 | (c & 0x3F)];
	}
	return out;
};

var stringifyPrimitive = function(v) {
	if (typeof v === 'string')
		return v;
	if (typeof v === 'number' && isFinite(v))
		return '' + v;
	if (typeof v === 'boolean')
		return v ? 'true' : 'false';
	/* istanbul ignore next */
	return '';
};