var proton = require('./proton');
var router = require('router');
var common = require('common');

var METHODS = 'all get post put head del delete options'.split(' ');
var PROXY = 'close bind listen upgrade'.split(' ');

var Collection = common.emitter(function(middleware) {
	this.middleware = proton(middleware);
});

METHODS.forEach(function(method) {
	Collection.prototype[method] = function() {
		var args = [].concat.apply([], arguments);
		var self = this;	
		var callback = args.pop();
		var middleware = this.middleware;
		var middlewareRequest;
		var first = [];

		for (var i = 0; i < args.length; i++) {
			if (typeof args[i] !== 'string') {
				if (!middlewareRequest) {
					middlewareRequest = proton(middleware);
					middleware = middlewareRequest.use(middleware, {extend:false});
				}

				middleware.use(args[i]);
			} else {
				first.push(args[i]);		
			}
		}

		var onroute = function(request, response, next) {
			middleware(request, response, common.fork(next, function() {
				callback(request, response, next);
			}));
		};

		first.push(onroute);
		this.emit('mount', method, first);
		return this;
	};
});

var Root = common.emitter(function() {
	this.middleware = proton();
	this.router = router();
	this.route = this.router.detach();

	var self = this;

	this.router.once('mount', function() {
		if (!self.using(self.route)) {
			self.use(self.route);
		}
	});
	this.router.on('request', function(request, response) {
		self.emit('request', request, response);
	});
	this.on('request', function(request, response) {
		self.middleware(request, response, function(err) {
			if (err) {
				response.writeHead(500);
				response.end(err.stack);
			} else {
				response.writeHead(404);
				response.end();
			}
		});
	});
	this.on('newListener', function(name, fn) {
		if (name === 'upgrade') {
			self.router.on(name, fn);
		}
	});

	this._main = new Collection();
});

Root.prototype.boot = function() {
	var self = this;
	var boot = new Root();

	Array.prototype.concat.apply([], arguments).forEach(function(pattern) {
		pattern = pattern.match(/^(?:(?:http|https):\/\/)?([^\/:]*)(?:\:\d+)?(.*)$/) || [];

		var host = new RegExp('^'+(pattern[1] || '*').replace(/\./g, '\\.').replace(/^\*$/, '.+?').replace(/\*/g, '[^.]+')+'(:|$)', 'i');
		var path = (pattern[2] || '').replace(/\/$/, '').toLowerCase();

		self.use(function(request, response, next) {
			if (!host.test(request.headers.host || '')) {
				next();
				return;
			}
			if (request.url.substring(0, path.length).toLowerCase() !== path) {
				next();
				return;
			}

			request.url = request.url.substring(path.length);
			boot.emit('request', request, response);
		});
	});

	return boot;
};
METHODS.forEach(function(method) {
	Root.prototype[method] = function() {
		var types = Array.prototype.slice.call(arguments).map(function(item) {
			return typeof item;
		}).filter(function(type) {
			return type !== 'string';
		});

		if (!types.length || (types.length === 1 && types[0] === 'function')) {
			this.router[method].apply(this.router, arguments);
		} else {
			this._main[method].apply(this._main, arguments);
		}

		return this;
	};
});
PROXY.forEach(function(method) {
	Root.prototype[method] = function() {
		this.router[method].apply(this.router, arguments);

		return this;
	};	
});

[Root, Collection].forEach(function(Proto) {
	var collection = function(self, name) {
		if (self[name]) {
			return self[name];
		}

		var col = self[name] = new Collection(self.middleware);

		col.on('mount', function(method, args) {
			self[method].apply(self, args);
		});

		return col;
	};

	Proto.prototype.using = function(fn) {
		return this.middleware.using(fn);
	};
	Proto.prototype.use = function(fn, other) {
		if (!fn) {
			return this;
		}
		if (typeof fn === 'string') {
			return collection(this, fn).use(other);
		}

		this.middleware.use(fn);

		return this;
	};
});

module.exports = exports = function() {
	var server = new Root();

	Array.prototype.concat.apply([], arguments).forEach(function(middleware) {
		server.use(middleware);
	});

	return server;
};

require('fs').readdirSync(__dirname+'/middleware').forEach(function(name) {
	exports[name.replace(/\.js$/i, '')] = require('./middleware/'+name);
});
