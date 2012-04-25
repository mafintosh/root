var assert = require('assert');
var root = require('../index');
var app = root();

var complete = 0;

var m = app.fork('/m');
var ip = app.fork('127.0.0.1');
var both = app.fork('example.com/test');
var port = app.fork('test.com:8080');

m.get(function(req) {
	assert.equal(req.url, '/');
	assert.ok(complete++ < 3);
});
ip.get(function(req) {
	assert.equal(req.url, '/');
	assert.equal(req.headers.host, '127.0.0.1');
	assert.equal(complete++, 3);
});
both.get(function(req) {
	assert.equal(req.url, '/');
	assert.equal(req.headers.host, 'example.com');
	assert.equal(complete++, 4);
});
port.get(function(req) {
	assert.equal(req.url, '/test');
	assert.equal(req.headers.host, 'test.com:8080');
	assert.equal(complete++, 5);
});


app.emit('request', {method:'GET', url:'/m', headers:{}}, {});
app.emit('request', {method:'GET', url:'/m/', headers:{}}, {});
app.emit('request', {method:'GET', url:'/m/', headers:{host:'127.0.0.1'}}, {});
app.emit('request', {method:'GET', url:'/', headers:{host:'127.0.0.1'}}, {});
app.emit('request', {method:'GET', url:'/test', headers:{host:'example.com'}}, {});
app.emit('request', {method:'GET', url:'/test', headers:{host:'test.com:8080'}}, {});
assert.equal(complete, 6);