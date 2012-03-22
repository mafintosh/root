var root = require('../index');
var app = root();

var m = app.boot('/m');
var ip = app.boot('127.0.0.1');

m.get(function(request, response) {
	response.end('i am /m');
});
ip.get(function(request, response) {
	response.end('i am 127.0.0.1');
});
app.get(function(request, response) {
	response.end('i am localhost');
});

app.listen(8080);