var ds = require('./');

module.exports = function(){

	console.log('--- Running Datastore Native tests ---');


	/// WebServer

	console.log( "Datastore.port:", ds.opts().localport );
	ds.ws.start({port:ds.opts().localport, bonjourName:ds.opts().localbonjour});
	//ds.ws.start({bonjourName:'who-fwa-dev-hosted-2'});


	/// Filesystem
	ds.fs.printDocumentsPath();
	

	ds.fs.ls({dir:'downloads'}, function(err, res){
		console.log("1 list (cb) expect: default => ", res);
	});
	
	ds.fs.ls({}, function(err, res){
		console.log("2 list (cb) expect: default in root => ", res);
	});
	ds.fs.ls({dir:'downloadsxxx'}, function(err, res){
		console.log("3 list (cb) expect:[] => ", res);
	});
	ds.fs.ls({dir:'downloads', exts:['png']}, function(err, res){
		console.log("4 list (cb) expect: only png => ", res);
	});
	ds.fs.ls({exts:['all']}, function(err, res){
		console.log("5 list (cb) expect: all => ", res);
	});
	
	ds.fs.lsw({dir:'/downloads'}, function(err, res){
		console.log("6 listwww (cb) expect: default => ", err, res);
	});


	//native.copy({path:"this/is/the/path", name:"this Is my NAME"}, function(err, res){
	//	console.log("native.copy.cb:", err, res);
	//});
	
	/// Downloads
	/*
	var ok1 = ds.dl(
		{urls:[
			"https://captbbrucato.files.wordpress.com/2011/08/dscf0585_stitch-besonhurst-2.jpg",
			"httpsx://static.pexels.com/photos/183/nature-sunny-grass-moss.jpg"
		], force:true, directory:'downloads'},
		function(err, res, opts){
			console.log('[STD] Proxied OnAllDone', err, res, opts);
		},
		function(message){ 
			console.log("Proxied OnStepComplete", message);
		},
		function(message){ 
			console.log("Proxied OnStepFail", message);
		},
		function(message){ 
			console.log("Proxied OnStepProgress", message);
		}	
	);
	console.log('Download started?', ok1);
	
	var ok2 = ds.dl(
		{urls:[
			"https://captbbrucato.files.wordpress.com/2011/08/dscf0585_stitch-besonhurst-2.jpg",
			"https://static.pexels.com/photos/183/nature-sunny-grass-moss.jpg"
		], force:true, directory:'downloads'},
		function(err, res){
			// Download done
			console.log('[SIMPLE] Download done', err, res);
		}
	);
	console.log('Download started?', ok2);
	*/


	var ok3 = ds.dl(
		{urls:[
			"https://captbbrucato.files.wordpress.com/2011/08/dscf0585_stitch-besonhurst-2.jpg",
			"https://static.pexels.com/photos/183/nature-sunny-grass-moss.jpg"
		], force:true, directory:'downloads'},
		function(err, res){
			console.log('[STD] Proxied OnAllDone', err, res);

			// Test rename (mv)
			var fn = 'downloads/'+ res.urls[0].split('/').slice(-1)[0];
			var nn = '_000-'+ Date.now()+'.jpg';

			console.log('rename: ', fn , "=>", nn );
			ds.fs.mv(fn, nn, function(err, res){
				console.log("rename (cb)", err, res);
			});

		},
		function(message){ 
			console.log("Proxied OnStepComplete", message);
		},
		function(message){ 
			console.log("Proxied OnStepFail", message);
		},
		function(message){ 
			console.log("Proxied OnStepProgress", message);
		}
	);
	console.log('Download started?', ok3);
	


	/// Uploads
	ds.up({
		remote: '/images/upload',
		id: '_000-'+ Date.now(),
		files: [
			{name:'front', path:'00.jpg'},
			{name:'back',  path:'01.jpg'}
		]
	}, function(err, res){
		if( err ){
			console.log('upload ERROR', err, res);
		}else{
			console.log('upload done', err, res);
		}
	});


}


