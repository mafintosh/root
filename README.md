# root

a super lightweight web framework with routing and connect middleware support.
it's available through npm:

	npm install root

usage is simple

``` js
var root = require('root').createServer();

root.get('/', function(request, response) {
	response.end('i am root');
});

root.listen(8080);
```

all routing is supported by the [router](https://github.com/gett/router) module.

## middleware

to apply middleware simply use `use`

``` js
root.use(function(request, response, next) { // or pass any connect-based middleware
	request.foo = 'bar!';
	next();
});

root.get(function(request, response) {
	response.end('foo: '+request.foo);
});
```

if you don't want to run a specific middleware on every request you can put it 
in a collection by providing the name of the collection to use

``` js
root.use('auth', function(request, response, next) {
	if (request.url.indexOf('?auth') === -1) {
		response.writeHead(403);
		response.end();
		return;
	}
	next();
});

root.get('/', function(request, response) {
	response.end('hello - all other calls are authenticated...');
});

root.auth.get(function(request, response) {
	response.end('hello mr auth');
});

// now visit /, /test and /test?auth
```

you can see the [root.json](https://github.com/mafintosh/root/blob/master/extensions/json.js) and [root.query](https://github.com/mafintosh/root/blob/master/extensions/query.js) middleware for examples on how to write your own.

## extensions

root also has a extension interface for embedding a middleware into a fully featured standalone web framework

``` js
var myExtension = root.createExtension(function(request, response, next) {
	// my middlware
	request.pong = Date.now();
	next();
});
```

We can choose to provide additional methods to the response and request

``` js
myExtension.response.ping = function() { // let's expand the response with a new method
	this.end(this.request.pong);
};

myExtension.request.host = function() { // we can also add methods to the request
	return this.headers.host;
};
```

The extension can now be used as a standalone root module

``` js
var server = myExtension.createServer();

server.get(function(request, response) {
	console.log('host is', request.host);
	response.ping();
});
```