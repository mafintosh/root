# root

a super lightweight web framework with routing and connect middleware support.
it's available through npm:

	npm install root

usage is simple

``` js
var root = require('root');
var app = root();

app.get('/', function(request, response) {
	response.end('i am root');
});

app.listen(8080);
```

all routing is supported by the [router](https://github.com/gett/router) module. see more usage examples [here](https://github.com/mafintosh/root/blob/master/examples/)

## middleware

to apply middleware simply use `use`

``` js
app.use(function(request, response, next) { // or pass any connect-based middleware
	request.foo = 'bar!';
	next();
});

app.get(function(request, response) {
	response.end('foo: '+request.foo);
});
```

if you don't want to run a specific middleware on every request you can put it 
in a collection by providing the name of the collection to use

``` js
app.use('auth', function(request, response, next) {
	if (request.url.indexOf('?auth') === -1) {
		response.writeHead(403);
		response.end();
		return;
	}
	next();
});

app.get('/', function(request, response) {
	response.end('hello - all other calls are authenticated...');
});

app.auth.get(function(request, response) {
	response.end('hello mr auth');
});

// now visit /, /test and /test?auth
```

you can see the [root.json](https://github.com/mafintosh/root/blob/master/middleware/json.js) and [root.query](https://github.com/mafintosh/root/blob/master/middleware/query.js) middleware for examples on how to write your own.

## prototypical middleware

root allows you to specify a prototype for the request and response to create useful and ultra fast middleware methods

``` js
var myMiddleware = function(request, respone, next) { // we could also just use an empty object literal
	request.pong = Date.now();
};
```

We can choose to provide additional methods to the response and request

``` js
myMiddleware.response = {};
myMiddleware.response.ping = function() { // let's expand the response with a new method
	this.end(this.request.pong);
};

myMiddleware.request = {};
myMiddleware.request.__defineGetter__('host', function() { // we can even use getters!
	return this.headers.host;
});
```

Now if we pass this middleware to `app.use` we'll be able to use methods in our request handlers:

``` js
app.use(myMiddleware);
app.get(function(request, response) {
	console.log('host: '+request.host);
	response.ping();
});
```