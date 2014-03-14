# root

A super lightweight web framework with routing and prototype [mixin](https://github.com/mafintosh/protein) support.

It's available through npm:

	npm install root

[![build status](https://secure.travis-ci.org/mafintosh/root.png)](http://travis-ci.org/mafintosh/root)

## Usage

Usage is simple

``` js
var root = require('root');
var app = root();

app.get('/', function(request, response) {
	response.send({hello:'world'});
});

app.post('/echo', function(request, response) {
	request.on('json', function(body) {
		response.send(body);
	});
});

app.listen(8080);
```

You can extend the request and response with your own methods

``` js
app.use('response.time', function() {
	this.send({time:this.request.time});
});
app.use('request.time', {getter:true}, function() {
	return Date.now();
});

app.get(function(request, response) {
	response.time();
});
```

## Routing

Routing is done using [murl](https://github.com/mafintosh/murl).
Use the `get`, `post`, `put`, `del`, `patch` or `options` method to specify the HTTP method you want to route

``` js
app.get('/hello/{world}', function(request, response) {
	response.send({world:request.params.world});
});
app.get('/test', function(request, response, next) {
	// call next to call the next matching route
	next();
});
app.get('/test', function(request, response) {
	response.send('ok');
});
```

## URL normalization

Before routing an incoming url it is first decoded and normalized

* `/../../` ⇨ `/`
* `/foo/bar/../baz` ⇨ `/foo/baz`
* `/foo%20bar` ⇨ `/foo bar`
* `/foo%2fbar` ⇨ `/foo/bar`

This basicly means that you don't need to worry about `/..` attacks when serving files or similar.

## Error handling

You can specify an error handler for a specific error code by using the `error` function

``` js
app.get('/foo', function(request, response) {
	response.error(400, 'bad request man');
});

app.error(404, function(request, response, opts) {
	// opts contains .message which is the message passed to response.error
	// and .stack if an error was passed
	response.send({error:'could not find route'});
});
app.error(function(request, response, opts) {
	response.send({error:'catch all other errors'});
});
```

## Using sub apps

Route requests through an sub app by using `app.route`

``` js
var mobileApp = root();
var myApp = root();
...
myApp.all('/m/*', function(request, response, next) {
	// all routes starting with /m should route through our mobile app as well
	mobileApp.route(request, response, next);
});
```

As a shortcut you can just pass the app directly

``` js
myApp.all('/m/*', mobileApp);
```

This allows you to easily split up your application into seperate parts
and mount them all on one server

## Full API

### Response

* `response.send(json)` will send back json.
* `response.send(string)` will send back html (if no Content-Type has been set).
* `response.error(statusCode, messageOrError)` send back an error
* `response.redirect(url)` send a http redirect

### Request

* `request.on('json', listener)` will buffer and parse the body as JSON.
* `request.on('form', listener)` will buffer and parse the body as a url encoded form
* `request.on('body', listener)` will buffer the body as a string
* `request.query` contains the parsed querystring from the url

### App

* `app.use(methodName, options, fn)` extend the request or response with a new prototype method
* `app.(get|put|post|del|options|patch)(pattern, fn)` add a route for a http method
* `app.all(pattern, fn)` route all methods
* `app.route(request, response, callback)` route a request or response from another app
* `app.error(statusCode, fn)` add an error handler. use `4xx` to match all 400 errors etc.
* `app.on('route', listener)` emitted everytime a request is being routed

## License

MIT
