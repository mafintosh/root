var protein = require('protein');
var router = require('router');
var common = require('common');

var METHODS       = 'all get post put head del delete options'.split(' ');
var MIDDLEWARE    = 'json query log body'.split(' ');
var PROXY_PROTEIN = 'fn getter setter'.split(' ');
var PROXY_ROUTER  = 'address close bind listen upgrade'.split(' ');
var PROXY_EVENTS  = 'request close listening bind error'.split(' ');

var reduce = function(args, middleware) {
	var fns = [];

	args = Array.prototype.concat.apply([], args).reduce(function(result, arg) {
		(typeof arg === 'function' ? fns : result).push(arg);
		return result;
	}, []);

	if (!fns.length) return args;

	var fn = fns.length === 1 ? fns.pop() : protein().use(fns);

	args.push(!middleware ? fn : function(req, res, next) {
		middleware(req, res, common.fork(next, function() {
			fn(req, res, next);
		}));
	});

	return args;
};

var Branch = common.emitter(function(middleware) {
	this.middleware = protein(middleware);
});
var Root = common.emitter(function() {
	this.middleware = protein();
	this.router = router();
	this.route = this.router.detach();

	var self = this;

	this.router.once('mount', function() {
		if (!self.using(self.route)) {
			self.use(self.route);
		}
	});
	this.on('request', function(req, res) {
		self.middleware(req, res);
	});	
	this.on('newListener', function(name, fn) {
		if (name === 'upgrade') {
			self.router.on(name, fn);
		}
	});

	PROXY_EVENTS.forEach(function(name) {
		self.router.on(name, function(a,b) {
			self.emit(name, a, b);
		});
	});
});

Root.prototype.error = function(fn) {
	var self = this;

	this.once('bind', function() {
		self.use(function(err, req, res, next) {
			fn(err, req, res, next);
		});
	});
	return this;
};
Root.prototype.fork = function() {
	var self = this;
	var boot = new Root();

	var route = function(req, res) {
		boot.emit('request', req, res);
	};
	
	Array.prototype.concat.apply([], arguments).forEach(function(pattern) {
		var fn = typeof pattern === 'function' && pattern;

		if (!fn) {
			pattern = pattern.match(/^(?:(?:http|https):\/\/)?([^\/:]*)(?:\:\d+)?(.*)$/) || [];

			var host = new RegExp('^'+(pattern[1] || '*').replace(/\./g, '\\.').replace(/^\*$/, '(.+)?').replace(/\*/g, '[^.]+')+'(:|$)', 'i');
			var path = (pattern[2] || '').replace(/\/$/, '').toLowerCase();

			fn = function(req, res, boot, next) {
				if (!host.test(req.headers.host || '')) return next();
				if (req.url.substring(0, path.length).toLowerCase() !== path) return next();

				req.url = ('/'+req.url.substring(path.length)).replace(/^\/\//, '/');
				boot(req, res);
			};
		}

		self.use(function(req, res, next) {
			fn(req, res, route, next);
		});
	});

	return boot;
};
METHODS.forEach(function(method) {
	Root.prototype[method] = function() {
		this.router[method].apply(this.router, reduce(arguments));
		return this;
	};
	Branch.prototype[method] = function() {
		this.emit('mount', method, reduce(arguments, this.middleware));
		return this;
	};
});
PROXY_ROUTER.forEach(function(method) {
	var binding = method === 'listen' || method === 'bind';

	Root.prototype[method] = function() {
		if (binding) {
			this.emit('bind');
		}

		var val = this.router[method].apply(this.router, arguments);

		return val === this.router ? this : val;
	};	
});
[Root, Branch].forEach(function(Proto) {
	Proto.prototype.branch = function(name, fn) {
		if (this[name]) return this[name];

		var self = this;
		var branch = this[name] = new Branch(this.middleware);

		branch.on('mount', function(method, args) {
			self[method].apply(self, args);
		});

		return fn ? branch.use(fn) : branch;
	};
	Proto.prototype.using = function(fn) {
		return this.middleware.using(fn);
	};
	Proto.prototype.use = function(route, fn) {
		this.middleware.use(route, fn);
		return this;
	};
	PROXY_PROTEIN.forEach(function(method) {
		Proto.prototype[method] = function(name, fn) {
			this.middleware[method](name, fn);
			return this;
		};
	});
});

exports = module.exports = function() {
	var server = new Root();

	Array.prototype.concat.apply([], arguments).forEach(function(middleware) {
		if (typeof middleware === 'string') return server.branch(middleware);
		server.use(middleware);
	});

	return server;
};

MIDDLEWARE.forEach(function(name) {
	exports[name] = require('./middleware/'+name);
});