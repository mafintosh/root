var cluster = require('cluster');
var protein = require('protein');
var router  = require('router');

var METHODS       = 'all get post put head del delete options'.split(' ');
var MIDDLEWARE    = 'json query log body'.split(' ');
var PROXY_PROTEIN = 'fn getter setter'.split(' ');
var SSL_OPTIONS   = 'cert key'.split(' ');

var noop = function() {};
var defunc = function(fn) {
	return {request:fn.request, response:fn.response};
};
var once = function(fn) {
	var ran = false;

	return function(a,b) {
		if (ran) return;
		ran = true;
		fn(a,b);
	};
};
var head = function(req, res) {
	var end = res.end;

	req.method = 'GET';
	res.end = function() {
		res.write = res.end = res.destroy = req.destroy = noop;
		end.call(res);
	};	
	res.write = function() {
		if (!res.writable) return;
		res.writable = false;
		res.end();
		req.emit('close');
		res.emit('close');
	};
};
var network = function() {
	var faces = require('os').networkInterfaces();

	for (var i in faces) {
		for (var j = 0; j < faces[i].length; j++) {
			if (faces[i][j].family === 'IPv4' && !faces[i][j].internal) {
				return faces[i][j].address;
			}
		}
	}
	return '127.0.0.1';
};
var reduce = function(args, middleware) {
	var fns = [];

	args = Array.prototype.concat.apply([], args).reduce(function(result, arg) {
		(typeof arg === 'function' ? fns : result).push(arg);
		return result;
	}, []);

	if (!fns.length) return args;

	var fn = fns.length === 1 ? fns.pop() : protein().use(fns);

	args.push(!middleware ? fn : function(req, res, next) {
		middleware(req, res, function(err) {
			if (err) return next(err);
			fn(req, res, next);
		});
	});

	return args;
};

var Branch = function(middleware) {
	this.middleware = protein(middleware);
};
var Root = function() {
	var self = this;

	this.servers = [];
	this.middleware = protein();
	this.route = router();
	this.route.head(function(req, res, next) { // experimental
		head(req, res);
		self.route(req, res, next);
	});
	this.route.onmount = once(function() {
		if (self.using(self.route)) return;
		self.use(self.route);
	});
	this.on('request', function(req, res) {
		self.emit('middleware');
		self.middleware(req, res);
	});
};

Root.prototype.__proto__ = Branch.prototype.__proto__ = process.EventEmitter.prototype;
Root.prototype.error = function(fn) { // experimental
	var self = this;

	this.once('middleware', function() {
		self.use(function(err, req, res, next) {
			if (!err) return next();
			fn(err, req, res, next);
		});
	});
	return this;
};
Root.prototype.fork = function() {
	var self = this;
	var args = Array.prototype.concat.apply([], arguments);
	var boot = typeof args[args.length-1] === 'object' ? args.pop() : new Root();
	var route = function(req, res) {
		boot.emit('request', req, res);
	};
	
	args.forEach(function(pattern) {
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

	return boot.use(defunc(this.middleware));
};
Root.prototype.address = function() {
	return this.servers[0] && this.servers[0].address();
};
Root.prototype.close = function(callback) {
	var running = this.servers.length;
	var self = this;

	this.once('close', callback || noop);
	this.servers.forEach(function(server) {
		server.once('close', function() {
			if (--running) return;
			self.emit('close');
		});
		server.close();
	});
	this.servers = [];
	return this;
};
Root.prototype.listen = function(server, options, callback) {
	if (typeof server === 'function')  return this.listen(null, null, server);
	if (typeof options === 'function') return this.listen(server, null, options);

	var self = this;
	var address = typeof server === 'string' && server.match(/^([\d\.]+)(?::(\d+))$/);
	var bind = address ? parseInt(address[2], 10) || 0 : server;

	callback = callback || noop;
	options = options || {};
	options.host = address && address[1];

	var reading = SSL_OPTIONS.some(function(name) {
		if (!options[name] || Buffer.isBuffer(options[name])) return false;

		require('fs').readFile(options[name], function(err, buf) {
			if (err) return self.emit('error', err);
			options[name] = buf;
			self.listen(server, options, callback);
		});
		return true;
	});

	if (reading) return this;
	if (server === null || typeof server !== 'object') {
		var env = process.env;
		var args = options.host ? [bind, options.host] : [bind];

		server = options.key ? require('https').createServer(options) : require('http').createServer();
		if (!bind && cluster.isWorker) { // HACK - we wanna to force a random port from net by faking us being master
			cluster.isWorker = false;
			process.env = {};
			server.listen.apply(server, args);
			cluster.isWorker = true;
			process.env = env;
		} else {
			server.listen.apply(server, args);
		}
	}

	server.on('listening', function() {
		if (self.servers.push(server) === 1) {
			self.emit('listening');
		}
		self.once('bind', callback);
		self.emit('bind', network()+':'+server.address().port, server);
	});
	server.on('error', function(err) {
		self.emit('error', err);
	});
	server.on('request', function(req, res) {
		self.emit('request', req, res);
	});
	server.on('upgrade', function(req, connection, head) {
		if (!self.listeners('upgrade').length) return connection.destroy();
		self.emit('upgrade', req, connection, head);
	});
	return this;
};

METHODS.forEach(function(method) {
	Root.prototype[method] = function() {
		this.route[method].apply(this.route, reduce(arguments));
		return this;
	};
	Branch.prototype[method] = function() {
		this.emit('mount', method, reduce(arguments, this.middleware));
		return this;
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
		if (!fn) return this.use(null, route);
		if (fn instanceof Root) {
			fn.emit('middleware');
			fn.use(defunc(this.middleware));
			fn = fn.middleware;
		}
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

module.exports = function() {
	var app = new Root();

	Array.prototype.concat.apply([], arguments).forEach(function(middleware) {
		if (typeof middleware === 'string') return app.branch(middleware);
		app.use(middleware);
	});

	return app;
};

MIDDLEWARE.forEach(function(name) {
	module.exports[name] = require('./middleware/'+name);
});