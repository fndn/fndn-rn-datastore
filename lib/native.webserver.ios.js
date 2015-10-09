// iOS Specific

var ds 	  	= require('../');
var started = false;

var inited 	= false;
var conf 	= {};
var addr 	= '';

module.exports.start = function(opts){

	opts = opts || {};
	
	if( opts.port == undefined ){
		opts.port = ds.opts().net.localport;
		//console.log('using default port:', opts.port );
	}
	ds.native.startServer(opts);
	started = true;
}

// Start the server immediately
module.exports.start({});


// Return (local) urls to images eg.: http://127.0.0.1:8899/products/4kknSyrR-front-300x300.jpg	
// You can show them with:
// <Image source={{ uri: Datastore.ws.img('products', productInfo.uuid, 'front', '300x300') }} />
// e.g.:
// <Image source={{ uri: Datastore.ws.img('products', '4kknSyrR', 'front', '300x300') }} />

module.exports.img = function(table, id, tag, size){
	if( !started ){
		console.log('*** ERROR *** local webserver has not started');
		return '';
	}
	if( !inited ){
		conf = ds.opts().net;
		addr = conf.localhost +':'+ conf.localport +'/';
		inited = true;
	}

	var fn = table +'/'+ id +'-'+ tag +'-'+ size +'.jpg';

	var record = ds.data.one("products", {uuid:id});
	//console.log(' > WS ONE record', record );
	if( record.imgstore ){
		var pos = ["front", "back", "left", "right"].indexOf(tag);
		fn = record.imgstore[pos].path.split("Documents/").slice(-1);
	}
	//console.log('WS URL:', addr + fn);
	return addr+fn;

	//console.log('ws.image', addr, table, id, tag, size); // 'ws.image', 'products', NJheV3mC', 'front', '300x300'
	
	//return addr + table +'/'+ id +'-'+ tag +'-'+ size +'.jpg';
}

/*
module.exports.img = function(table, id, tag, size, cb){
	if( !started ){
		console.log('*** ERROR *** local webserver has not started');
		return '';
	}
	if( !inited ){
		conf = ds.opts().net;
		addr = conf.localhost +':'+ conf.localport +'/';
		inited = true;
	}

	//console.log('ws.image', addr, table, id, tag, size); // 'ws.image', 'products', NJheV3mC', 'front', '300x300'
	
	return addr + table +'/'+ id +'-'+ tag +'-'+ size +'.jpg';
}
*/

module.exports.raw = function(filename){
	if( !started ){
		console.log('*** ERROR *** local webserver has not started');
		return '';
	}
	if( !inited ){
		conf = ds.opts().net;
		addr = conf.localhost +':'+ conf.localport +'/';
		inited = true;
	}
	//console.log('ws.image', addr, table, id, tag, size); // 'ws.image', 'products', NJheV3mC', 'front', '300x300'
	
	return addr + filename;
}