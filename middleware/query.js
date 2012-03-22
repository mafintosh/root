var url = require('url');

exports.request = {};
exports.request.__defineGetter__('query', function() {
	return this._query || (this._query = url.parse(this.url, true).query);
});