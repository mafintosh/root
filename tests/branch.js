var assert = require('assert');
var root = require('../index');
var app = root();

var complete = 0;

app.branch('foo');

app.use(function(req, res, next) {
	req.master = true;
	next();
});
app.fn('request.name', function() {
	return 'master';
});
app.foo.use(function(req, res, next) {
	req.branch = true;
	next();
});
app.foo.fn('request.name', function() {
	return 'foo';
});
app.foo.fn('request.hidden', function() {
	return true;
});
app.get('/', function(req) {
	assert.ok(req.master);
	assert.ok(!req.branch);
	assert.equal(typeof req.hidden, 'undefined');
	assert.equal(req.name(), 'master');
	assert.equal(complete++, 0);
});
app.foo.get('/branch', function(req) {
	assert.ok(req.master);
	assert.ok(req.branch);
	assert.equal(typeof req.hidden, 'function');
	assert.equal(req.name(), 'foo');
	assert.equal(complete++, 1);
});


app.emit('request', {method:'GET', url:'/'}, {});
app.emit('request', {method:'GET', url:'/branch'}, {});
assert.equal(complete, 2);