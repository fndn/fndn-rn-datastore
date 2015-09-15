// iOS Specific

var ds 	= require('../');

module.exports.start = function(opts){
	if( !opts.port ){
		console.log('using default port:', ds.opts.localport );
		opts.port = ds.opts.localport;
	}
	ds.native.startServer(opts);
}