# root

a super lightweight web framework with routing and connect and [protein](https://github.com/mafintosh/protein) middleware support.
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

all routing is supported by the [router](https://github.com/gett/router) module.

## Middleware

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

if you don't want to run a specific middleware on every request you can put it in a branch

``` js
var app = root('auth');

app.use(root.query);
app.auth.use(function(request, response, next) {
	if (!request.query.auth) {
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

// now visit /, /test and /test?auth=1
```

you can see the [root.json](https://github.com/mafintosh/root/blob/master/middleware/json.js) and [root.query](https://github.com/mafintosh/root/blob/master/middleware/query.js) middleware for examples on how to write your own.

## Prototypical middleware

root allows you to specify a prototype for the request and response to create useful and ultra fast middleware methods.
it does this by using the [protein](https://github.com/mafintosh/protein) module

``` js
var myMiddleware = function(request, respone, next) { // we could also just use an empty object literal
	request.pong = Date.now();
	next();
};
```

We can choose to expand the request and response with additional methods

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

There is also a shorthand syntax for doing this through the methods `fn` and `getter`:

``` js
app.fn('response.ping', function() {
	return this.request.pong;
});
app.getter('request.host', function() {
	return this.headers.host;
});
```


## License 

**This software is licensed under "MIT"**

> Copyright (c) 2012 Mathias Buus Madsen <mathiasbuus@gmail.com>
> 
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
> 
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
> 
> THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
