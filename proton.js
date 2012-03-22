var PROTOS = {
	request: require('http').IncomingMessage.prototype,
	response: require('http').ServerResponse.prototype
};

var noop = function() {};
var extend = function(to, from) {
	Object.keys(from || {}).forEach(function(key) {
		var getter = from.__lookupGetter__(key);

		if (key in to) {
			return;
		}
		if (getter) {
			to.__defineGetter__(key, getter);
			return;
		} 

		to[key] = from[key];
	});

	return to;
};
var proton = function(parent) {
	var stack = [];

	parent = parent || {};

	var reduce = function(request, response, callback) {
		var i = 0;
		var loop = function(err) {
			var next = stack[i++];

			if (!next) {
				(callback || noop)(err);
				return;
			}
			if (err && next.length < 4) {
				loop(err);
				return;
			}
			if (next.length >= 4) {
				next(err, request, response, loop);
				return;
			}

			next(request, response, loop);
		};

		// set request prototype
		request.response = response;
		request.__proto__ = reduce.request;

		// set response prototype
		response.request = request;
		response.__proto__ = reduce.response;

		// bootstrap the loop
		loop();
	};

	['request','response'].forEach(function(name) {
		reduce[name] = {};
		reduce[name].__proto__ = parent[name] || PROTOS[name];
	});

	reduce.using = function(fn) {
		return stack.indexOf(fn) > -1;
	};
	reduce.use = function(fn, options) {
		if (!fn) {
			return reduce;
		}
		if (Array.isArray(fn)) {
			fn.forEach(reduce.use);

			return reduce;
		}
		if (typeof fn === 'function') {
			stack.push(fn);
		}
		if (options && options.extend === false) {
			return reduce;
		}

		extend(reduce.request, fn.request);
		extend(reduce.response, fn.response);

		return reduce;
	};

	return reduce;
};

module.exports = proton;