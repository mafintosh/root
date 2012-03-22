var root = require('../index');
var app = root();

app.use(root.json);
app.use(root.log);

app.get('/', function(request, response) {
	console.log('??')
	response.json({hello:'world'});
});
app.post(function(request, response) {
	response.json({echo:request.json});
});

app.use(function(request, response) {
	response.json(404, {error:'lol'});
});

app.listen(8080);