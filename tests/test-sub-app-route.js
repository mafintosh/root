var assert = require('assert');
var exec = require('child_process').exec;
var root = require('../index');

var app1 = root();
var app2 = root();
var ran = 0;

app1.all(function(request, response, next) {
	ran++;
	app2.route(request, response, next);
});
app1.get('/static-file.html', function(request, response) {
	ran++;
	response.end();
});

app2.get('/', '/static-file.html');

app1.listen(9999, function() {
	exec('curl localhost:9999;', function() {
		assert.equal(ran, 2);
		process.exit(0);
	});
});

