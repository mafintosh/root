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