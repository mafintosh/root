var isError = require('util').isError;
var parse = function(body) {
	try {
		return JSON.parse(body || '{}') || {};
	} catch (err) {
		return {};
	}
};

var fn = function(request, response, next) {
	response.json = response.json.bind(response);

	if (request.body || (request.method === 'GET' || request.method === 'HEAD')) {
		next();
		return;
	}

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
fn.request.__defineGetter__('json', function() {
	return this._json || (this._json = parse(this.body));
});

fn.response = {};
fn.response.json = function(status, doc) {
	if (typeof status === 'number' && /^[^23]/.test(status) && (!doc || typeof doc === 'string')) {
		doc = {status:status, message:(doc || 'whoops')};
	}
	if (isError(status)) {
		var statusCode = status.status || status.statusCode || 500;

		this.json(statusCode, {status:statusCode, message:status.message});
		return;
	}
	if (doc) {
		this.statusCode = status;
	} else {
		doc = status;
	}

	doc = doc === undefined ? null : doc;
	doc = JSON.stringify(doc);

	this.setHeader('Content-Type', 'application/json; charset=utf-8');
	this.setHeader('Content-Length', Buffer.byteLength(doc));
	this.end(doc);
};

module.exports = fn;