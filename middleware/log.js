var pad = function(num) {
	return '00'.substr((''+num).length)+num;
};
var now = function() {
	var d = new Date();

	return pad(d.getUTCHours())+':'+pad(d.getUTCMinutes())+':'+pad(d.getUTCSeconds())+
		' '+pad(d.getUTCDate())+'/'+pad(d.getUTCMonth()+1)+'/'+pad(d.getUTCFullYear()-2000);
};

module.exports = function(request, response, next) {
	console.log(now()+' - ['+request.method+'] '+request.url);
	next();
};