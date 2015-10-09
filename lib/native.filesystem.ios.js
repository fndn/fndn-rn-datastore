// iOS Specific

var ds 	= require('../');


module.exports.paths = function(cb){
	//ds.native.printDocumentsPath();
	ds.native.paths({}, cb );
}

/// List a directory via Native
module.exports.ls = function(opts, cb){
	ds.native.list(opts, cb);
}

/// List a directory via the webserver
module.exports.lsw = function(opts, cb){

	var uri = ds.opts().net.localhost +':'+ ds.opts().net.localport + opts.dir;

	ds.xhr({'method':'GET', 'uri':uri}, function (err, resp, body){
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

module.exports.exists = function(filename, cb){
	ds.native.exists({filename:filename}, cb);
}