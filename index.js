var router = require('router');
var common = require('common');
var http = require('http');

var noop = function() {};
var extend = function(to, from) {
	Object.keys(from || {}).forEach(function(key) {
		to[key] = to[key] || from[key];
	});

	return to;
};
var plugin = function(from) {
	return function(fn) {
		fn.createServer = function() {
			return from.createServer.apply(from, arguments).use(fn);
		};

		fn.createPlugin = plugin(fn);
		fn.request = {};
		fn.response = {};

		return fn;
	};
};
var all = function(stack, request, response, callback) {
	callback = callback || noop;

	var i = 0;
	var loop = function(err) {
		if (err) {
			response.writeHead(err.statusCode || 500);
			response.end(err.message);
			return;
		}
		if (i >= stack.length) {
			callback();
			return;
		}

		var next = stack[i++];

		next(request, response, loop);

		if (next.length > 2) {
			return;
		}

		callback();
	};

	loop();
};

var Root = common.emitter(function(parent) {
	var self = this;

	this._stack = [];

	this.router = parent.router || router();
	this.route = this.router.route;
	this.on('newListener', function(name, fn) {
		self.router.on(name, fn);
	});

	['request','response'].forEach(function(prop) {
		(self[prop] = {}).__proto__ = parent[prop];
	});
});

Root.prototype.collection = function(name) {
	return this[name] || (this[name] = this._forward(new Root(this)));
};
Root.prototype.namespace = function(name, fn) {
	if (fn) {
		return this.use(name, fn).namespace(name);
	}

	return this._forward(new Root({
		request:this.request,
		response:this.response,
		router:this.router.namespace(name)
	}));
};
Root.prototype.use = function(name, fn) {
	if (!fn) {
		fn = name;
	} else {
		return this.collection(name).use(fn);
	}

	extend(this.request, fn.request);
	extend(this.response, fn.response);

	this._stack.push(fn);

	return this;
};

['get','options','post','put','del','head','all'].forEach(function(method) {
	Root.prototype[method] = function() {
		var self = this;
		var fn = arguments[arguments.length-1];

		if (typeof fn === 'function') {
			arguments[arguments.length-1] = function(request, response, next) {
				response.__proto__ = self.response;
				response.request = request;

				request.__proto__ = self.request;
				request.response = response;

				self._middleware(request, response, function() {
					fn(request, response, next);
				});
			};			
		}

		this.router[method].apply(this.router, arguments);
		return this;
	};
});
['listen', 'bind', 'close', 'upgrade'].forEach(function(method) {
	Root.prototype[method] = function() {
		this.router[method].apply(this.router, arguments);
		return this;
	};
});

Root.prototype._middleware = function(request, response, next) {
	all(this._stack, request, response, next);
};
Root.prototype._forward = function(root) {
	var self = this;

	return root.use(function(request, response, next) {
		self._middleware(request, response, next);
	});
};

exports.createServer = function() {
	var root = new Root({
		request:http.IncomingMessage.prototype,
		response:http.ServerResponse.prototype
	});

	[].concat(Array.prototype.slice.call(arguments)).forEach(function(item) {
		if (typeof item === 'function') {
			root.use(item);
			return;
		}
		if (typeof item === 'string') {
			root.collection(item);
			return;
		}

		Object.keys(item).forEach(function(key) {
			root.use(key, item[key]);
		});
	});

	return root;
};
exports.createExtension = plugin(exports);