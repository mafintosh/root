var qs = require('querystring');
var parse = function(body) {
	try {
		return qs.parse(body || '') || {};
	} catch (err) {
		return {};
	}
};

var fn = function(request, response, next) {
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
fn.request.__defineGetter__('form', function() {
	return this._form || (this._form = parse(this.body));
});

module.exports = fn;