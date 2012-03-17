# root

a micro web framework with routing and connect middleware support.
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
root.use(function(request, response, next) {
	request.foo = 'bar!';
	next();
});

root.get(function(request, response) {
	response.end('foo: '+request.foo);
});
```

you can choose to group middleware by adding a name

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

root.auth.get(function() {
	response.end('hello mr auth');
});

// now visit /, /test and /test?auth
```