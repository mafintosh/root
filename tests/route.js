var assert = require('assert');
var root = require('../index');
var app = root();

var complete = 0;

app.get('/test', function() {
	assert.equal(complete++, 0);
});
app.get('/', function() {
	assert.equal(complete++, 1);
});
app.post('/test/:arg', function(req) {
	assert.equal(req.method, 'POST');
	assert.equal(req.params.arg, 'hello');
	assert.equal(complete++, 2);
});
app.get(function(req) {
	assert.equal(req.url, '/all');
	assert.equal(complete++, 3);
});
app.get('/fall', function(req, res, next) {
	assert.equal(complete++, 4);
	next();
});
app.get('/fall', function(req, res) {
	assert.equal(complete++, 5);
});

app.route({method:'GET', url:'/test'}, {});
app.route({method:'GET', url:'/'}, {});
app.route({method:'POST', url:'/test/hello'}, {});
app.route({method:'GET', url:'/all'}, {});
app.route({method:'GET', url:'/fall'}, {});

assert.equal(complete, 6);