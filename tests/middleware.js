var assert = require('assert');
var root = require('../index');
var app = root();

var complete = 0;

app.use(function(req, res, next) {
	assert.equal(complete++, 0);
	req.hello = 42;
	next();
});

app.get('/', function(req) {
	assert.equal(complete++, 1);
	assert.equal(req.hello, 42);
});

app.emit('request', {method:'GET', url:'/'}, {});
assert.equal(complete, 2);