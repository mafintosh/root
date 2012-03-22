var collection = require('../lib/collection');

var server = require('http').createServer();
var col = collection();

server.on('request', col.route);

col.use(function(request, response) {
	request.foo = request.foo || 0;
	request.foo++;
});
col.get('/foo', '/');
col.get('/', function(request, response, next) {
	next();
});
col.get('/', function(request, response) {
	request.foo += 10;
}, function(request, response, next) {
	next();
});
col.get('/', function(request, response) {
	response.end('root3: '+request.foo);
});

col.get('/{test}', function(request, response) {
	response.end(request.url);
});

server.listen(8080);