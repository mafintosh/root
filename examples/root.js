var root = require('../index3');

var server = root();

server.use(function(request, response) {
	response.foo = '42';
});

server.get('/', function(request, response) {
	response.foo += 'lol'
}, function(request, response) {
	response.end(response.foo);
});

server.get('/foo', function(request, response) {
	response.end(response.foo);
});

server.use('test').use(function(request, response) {
	request.test = true;
});

server.test.get('/test', function(request, response) {
	response.end(''+(!!request.test));
});
server.get('/nottest', function(request, response) {
	response.end(''+(!!request.test));
});


server.listen(8080);