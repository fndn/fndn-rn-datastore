// iOS Specific

var ds 	= require('../');

// todo: Add Queue and Callbacks
// todo: Make Async

module.exports = function(opts, cb){
	//console.log('UP 1', opts);

	var obj = {
		uploadUrl: ds.opts().net.remotehost + opts.remote,
		token: ds.opts().net.auth_token,
		fields: { 'productId': opts.id },
		files: []
	}
	for( var f in opts.files ){
		obj.files.push({
			filename: opts.files[f].name,
			filepath: opts.files[f].path,
		});
	}

	ds.native.upload(obj, function(err, result) {
		//console.log('[internal upload cb:]', err, result, obj, opts);
		var data = result;
		if( result.data ){
			data = JSON.parse(result.data);

			// http://127.0.0.1:8090/products/upload
			// http://127.0.0.1:8090/pub/products/img/N1c70Dyex-back-300x300.jpg

			data.url = ds.opts().net.remotehost 
				+'/pub' 
				+ opts.remote.replace('upload', 'img') 
				+'/'+ opts.id 
				+'-'
				+opts.files[0].name 
				+'-1136x640.jpg';

		}
		if( cb != undefined ) cb( err, data );
	});
}