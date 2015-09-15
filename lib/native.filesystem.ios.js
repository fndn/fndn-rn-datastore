// iOS Specific

var ds 	= require('../');
var xhr = require('xhr');

module.exports.printDocumentsPath = function(){
	ds.native.printDocumentsPath();	
}

/// List a directory via Native
module.exports.ls = function(opts, cb){
	ds.native.list(opts, cb);
}

/// List a directory via the webserver
module.exports.lsw = function(opts, cb){

	var uri = ds.opts.net.localhost +':'+ ds.opts.net.localport + opts.dir;

	xhr({'method':'GET', 'uri':uri}, function (err, resp, body){
		//console.log("_listDocumentsFolder:", err, resp.statusCode);
		if( err===null && resp.statusCode === 200 ){
			//console.log("dir listing:", resp.statusCode);
			//console.log(body);
			var res = {list:[]};
			var imgs = body.match(/">([A-z]|[0-9])(.*?)(.jpg)/g);
			if( imgs != null ){
				res.list = imgs.map( function(itm){ return itm.slice(2); });
				console.log("res:", res);
			}
			if( cb != undefined ) cb(null, res );
		}else{
			if( cb != undefined ) cb(true, err );
		}
	});
}

module.exports.mv = function(from, to, cb){
	ds.native.mv({curname:from, newname:to}, cb);
};

module.exports.cp = function(from, to, cb){
	//ds.native.mv({curname:from, newname:to}, cb);
	console.log("NOT IMPLEMENTED: fs.cp()");
};
