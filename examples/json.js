var root = require('../index');
var app = root();

app.use(root.json);
app.use(root.log);

app.get(function(request, response) {
	response.json({hello:'world'});
});
app.post(function(request, response) {
	response.json({echo:request.json});
});

app.listen(8080);