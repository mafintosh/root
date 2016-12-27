var assert = require('assert');
var exec = require('child_process').exec;
var root = require('../index');
var app = root();

var ran = 0;

var patterns = [
	'/',
	'/foo',
	'/{foo}',
	'*',
	'/foo',
	'/foo'
]

app.on('match', function (req, res, pattern) {
	ran++;
	assert.equal(patterns.shift(), pattern)
})

app.get('/', end);
app.get('/foo', end);
app.get('/{foo}', end);
app.get(end);
app.post('/foo', end);
app.head('/foo', end);

app.listen(9999, function() {
	exec('curl localhost:9999; curl localhost:9999/foo; curl localhost:9999/foobar; curl localhost:9999/foo/bar; curl -X POST localhost:9999/foo; curl -I localhost:9999/foo', function() {
		assert.equal(ran, 6);
		process.exit(0);
	});
});

function end (req, res) {
	res.end();
}
