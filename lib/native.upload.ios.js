// iOS Specific

var ds 	= require('../');

// todo: Add Queue and Callbacks
// todo: Make Async

module.exports = function(opts, cb){
	var obj = {
		uploadUrl: ds.opts().net.remotehost + opts.remote,
		fields: { 'productId': opts.id },
		files: []
	}
	for( var f in opts.files ){
		console.log('f', f, opts.files[f]);
		obj.files.push({
			filename: opts.files[f].name,
			filepath: opts.files[f].path,
		});
	}
	ds.native.upload(obj, function(err, result) {
		console.log('[internal upload cb:]', err, result);
		if( result.data ) console.log('result json:', JSON.parse(result.data) );
		if( cb != undefined ) cb( result );
	});
}