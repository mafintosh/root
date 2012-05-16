var RESERVED = '__$RESERVED$__';
var logger = function(pattern) {
	pattern = pattern || ':response.statusCode :request.method :request.url';

	var tokens = [];
	var compiled = pattern.replace(/\:([\w\-\.]+(?:\[[\w\-\.]+\])?)/g, function(_, token) {
		tokens.push(token);
		return RESERVED;
	}).split(RESERVED).map(JSON.stringify).reduce(function(result, part, i) {
		if (!tokens[i]) return result+'+'+part;

		var parts = tokens[i].split('.');
		var obj = parts.shift().substr(0,3);
		var prop = parts.shift();
		var arg = parts.shift();

		return result+'+'+part+'+(get('+obj+','+JSON.stringify(prop)+','+JSON.stringify(arg)+') || "[not-set]")';
	}, '""').replace(/""\+/g, '').replace(/\+""/g, '');

	var get = function(obj, prop, sub) {
		return sub ? obj[prop][sub] : obj[prop];
	};

	return eval('(function(req,res) { return '+compiled+'; })');
};
var middleware = function(format) {
	var log = logger(format);

	return function(req, res, next) {
		var end = res.end;

		res.end = function(data, enc) {
			console.log(log(req, res));
			res.end = end;
			res.end(data, enc);
		};
		next();
	};
};
var DEFAULT = middleware();

module.exports = function(req, res, next) { // a bit hackish for backwards compat
	if (next) return DEFAULT(req, res, next);
	return middleware(req);
};