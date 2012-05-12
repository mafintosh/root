module.exports = function(name, parse) {
	var cache = '_'+name;
	var fn = function(request, response, next) {
		if (request.body !== undefined || (request.method === 'GET' || request.method === 'HEAD')) return next();

		request.body = '';
		request.setEncoding('utf-8');
		request.on('data', function(data) {
			request.body += data;
		});
		request.on('end', function() {
			next();
		});
	};

	fn.request = {};
	fn.request.__defineGetter__(name, function() {
		return this[cache] || (this[cache] = parse(this.body));
	});

	return fn;
};