var assert = require('assert');
var root = require('../index');
var app = root();

var complete = 0;

app.use(function(req, res, next) {
	req.meh = true;
	next();
});

app.get('/', function(req, res, next) {
	req.hello = 42;
	next();
}, function(req) {
	assert.equal(req.hello, 42);
	assert.equal(complete++, 0);
});
app.get('/arr', [function(req, res, next) {
	req.hello = 43;
	next();
}, function(req) {
	assert.equal(req.hello, 43);
	assert.ok(req.meh);
	assert.equal(complete++, 1);
}]);

app.branch('test');

app.test.use(function(req, res, next) {
	req.test = true;
	next();
});

app.test.get('/abe', function(req, res, next) {
	req.abe = 10;
	next();
}, function(req, res, next) {
	assert.equal(req.abe, 10);
	assert.equal(complete++, 2);
});
app.test.get('/fest', function(req, res, next) {
	req.abe = 11;
	next();
}, function(req, res, next) {
	assert.ok(req.test);
	assert.equal(req.abe, 11);
	assert.equal(complete++, 3);
});


app.emit('request', {method:'GET', url:'/'}, {});
app.emit('request', {method:'GET', url:'/arr'}, {});
app.emit('request', {method:'GET', url:'/abe'}, {});
app.emit('request', {method:'GET', url:'/fest'}, {});

assert.equal(complete, 4);