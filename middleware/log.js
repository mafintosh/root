var RESERVED = '__$RESERVED$__';
var pad = function(num) {
	return '00'.substr((''+num).length)+num;
};
var now = function() {
	var d = new Date();

	return pad(d.getUTCHours())+':'+pad(d.getUTCMinutes())+':'+pad(d.getUTCSeconds())+
		' '+pad(d.getUTCDate())+'/'+pad(d.getUTCMonth()+1)+'/'+pad(d.getUTCFullYear()-2000);
};
var logger = function(pattern) {
	pattern = ':method :url :status - :response-time ms';

	var maps = {};
	var tokens = [];
	var compiled = pattern.replace(/\:([\w\-]+(?:\[[\w\-]+\])?)/g, function(_, token) {
		tokens.push(token);
		return RESERVED;
	}).split(RESERVED).map(JSON.stringify).reduce(function(result, part, i) {
		if (!tokens[i]) return result+'+'+part;
		return result+'+'+part+
			'+(maps["'+tokens[i].split('[')[0].toLowerCase()+'"](req,res,'+
			JSON.stringify(tokens[i].split('[').pop().split(']')[0].toLowerCase())+')||"[not-set]")';
	}, '""').replace(/""\+/g, '').replace(/\+""/g, '');

	maps['remote-addr'] = function(req) {
		return req.remoteAddress;
	};
	maps['user-agent'] = function(req) {
		return req.headers['user-agent'];
	};
	maps['response-time'] = function(req) {
		return ''+(Date.now() - req._startTime);
	};
	maps.date = function() {
		return now();
	};
	maps.referrer = function(req) {
		return req.headers.referer || req.headers.referrer;
	};
	maps.req = function(req, res, name) {
		return req.headers[name];
	};
	maps.res = function(req, res, name) {
		return res.headers[name];
	};
	maps.status = function(req, res) {
		return res.statusCode;
	};
	maps.method = function(req) {
		return req.method;
	};
	maps.url = function(req) {
		return req.url;
	};
	maps.body = function(req) {
		return req.body;
	};

	return eval('(function(req,res) { return '+compiled+'; })');
};
var middleware = function(format) {
	var log = logger(format);

	return function(req, res, next) {
		var end = res.end;

		req._startTime = Date.now();
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