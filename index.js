var router = require('router');
var common = require('common');

var noop = function() {};
var all = function(stack, request, response, callback) {
	callback = callback || noop;

	var i = 0;
	var loop = function() {
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

var Root = common.emitter(function(server, name) {
	var self = this;

	this._server = server || router();
	this._stack = [];
	this._name = name;

	this.route = this._server.route;
	this.on('newListener', function(name, fn) {
		self.router.on(name, fn);
	});
});

Root.prototype.collection = function(name) {
	return this[name] || (this[name] = this._forward(new Root(this._server, name)));
};
Root.prototype.namespace = function(name) {
	return this._forward(new Root(this._server.namespace(name || this._name)));
};
Root.prototype.use = function(name, fn) {
	if (!fn) {
		fn = name;
	} else {
		return this.collection(name).use(fn);
	}

	this._stack.push(fn);

	return this;
};

['get','post','put','del','head','all'].forEach(function(method) {
	Root.prototype[method] = function() {
		var self = this;
		var fn = arguments[arguments.length-1];

		if (typeof fn === 'function') {
			arguments[arguments.length-1] = function(request, response, next) {
				self._middleware(request, response, function() {
					fn(request, response, next);
				});
			};			
		}

		this._server[method].apply(this._server, arguments);
		return this;
	};
});
['listen', 'bind', 'close', 'upgrade'].forEach(function(method) {
	Root.prototype[method] = function() {
		this._server[method].apply(this._server, arguments);
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
	var using = [].concat(Array.prototype.slice.call(arguments));
	var root = new Root();

	using.forEach(function(item) {
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