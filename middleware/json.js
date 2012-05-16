var isError = require('util').isError;
var body = require('./body');

var fn = body('json', function(data) {
	try {
		return JSON.parse(data || '{}') || {};
	} catch (err) {
		return {};
	}
});

fn.response = {};
fn.response.json = function(status, doc) {
	if (typeof status === 'number' && status >= 400 && (!doc || typeof doc === 'string')) {
		doc = {statusCode:status, message:(doc || 'something bad happened')};
	}
	if (isError(status)) {
		var statusCode = status.status || status.statusCode || 500;

		this.json(statusCode, {statusCode:statusCode, message:status.message});
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