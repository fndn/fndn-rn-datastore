var Datastore 	= require('fndn-rn-datastore');

var SyncRoutine = require('./native.sync.routine.ios.js');
var async 		= require('async');
//var moment 		= require('moment');

var _abort_ 	= false;

var processProductImages = module.exports.extractProductImages = function(items, cb){

	for(var i=0; i<items.length; i++){
		var p = items[i];
		console.log(' extractProductImages > product.uuid', p.product.uuid);

		// copy the images [{name:front, path:/a/b.jpg},...]
		var files = Datastore.clone( p.product.images );

		for(var f in files){
			var f = files[f];
			if( f === null ){
				console.log('f', f);
				p.product.images = false;
			}else{
				console.log('###');
				// during dev:
				//Datastore.data.del("imageQueue", {id:p.product.uuid} );
				//console.log('DEVONLY: Removed '+ p.product.uuid +' from imageQueue');

				var path = f.path.split("/").slice(-1)[0];
				var o = {id:p.product.uuid, uploaded:8989, name:f.name, model:'products', path:path};
				Datastore.data.addu("imageQueue", o );
				p.product.images = true;
			}
		}

		// update the datastore
		Datastore.data.put("registrations", {name:p.name}, p);
	}

	cb();
}


var uploadImageQueue = module.exports.uploadImageQueue = function(table, progress_cb, complete_cb){

	var items = Datastore.data.all("imageQueue");
	console.log('2 raw items', items);
	//items = items.filter( function(el){ return !el.uploaded } ); /// ################
	//console.log('3 raw items', items);
	_uploadImageQueue_step(table, items, items.length, progress_cb, complete_cb);
}

function _uploadImageQueue_step(table, items, itemsStartcount, progress_cb, complete_cb){

	//console.log('_uploadImageQueue_step table:', table, items.length);

	if( items.length == 0){
		complete_cb();
	}else{
		_uploadImageQueue_worker(table, items, itemsStartcount, _uploadImageQueue_step, progress_cb, complete_cb );
	}
}

function _uploadImageQueue_worker(table, itms, itemsStartcount, cb, progress_cb, complete_cb){

	var itm  = itms.shift();
	var path = itm.path.split("/").slice(-1)[0];

	var obj = {
		remote: '/'+ table +'/upload',
		id: itm.id,
		files: [{name:itm.name, path:path}]
	};
	//console.log('_uploadImageQueue_worker', obj);

	Datastore.up(obj, function(err, res){
		if( err ){
			console.log('upload ERROR', err, res);
			Datastore.data.put("imageQueue", {id:itm.id}, {uploaded:true, failed:true} );

		}else{
			console.log('upload OK', res);

			// Mark the item as uploaded (could just delete it)
			Datastore.data.put("imageQueue", {id:res.id, name:itm.name}, {uploaded:true} );
			
			//TODO: Delete the image /// ################
		}
		progress_cb( (itemsStartcount-itms.length) / itemsStartcount * 100 );
		cb(table, itms, itemsStartcount, progress_cb, complete_cb);
	});
}

var listMissingImages = module.exports.listMissingImages = function(table, sizes, tags, cb){
	// Determine wich images we need

	var url_prefix = Datastore.opts().net.remotehost + '/pub/'+ table +'/img/';

	var items = Datastore.data.all(table).slice(0,2);
	//console.log('items', items);
	console.log('items.length', items.length);

	// Compose a list of filenames
	var wish = [];
	for(var i = 0; i<items.length; i++){
		var f = items[i].uuid || items[i].id || false;
		if(f){
			var a = tags.map( function(t){ return f +'-'+ t});
			var b = [];
			for(var s in sizes){
				for(var f in a){
					b.push( a[f] +'-'+ sizes[s] +'.jpg' );
				}
			}		
			wish = wish.concat( b );
		}
		
		//console.log('items[i].images', items[i].images);
	}
	//console.log('wish', wish);

	// Compare with what we have already
	var listing = Datastore.fs.ls({dir:table}, function(err, res){
		console.log('listing', res); // 'listing', { list: [ 'NJheV3mC-left-300x300.jpg' ], directory: 'products' }

		var result = [];
		for(var i in wish){
			if( res.list.indexOf( wish[i] ) > -1 ){
				console.log('we already have ', wish[i] );
			}else{
				result.push( url_prefix + wish[i] );
			}
		}
		console.log('result', result);
		cb( result );
	});
}

module.exports.abort = function(cb){
	_abort_ = true;
}

var chained = module.exports.chained = function(self, cb){
	var _buffer = "[Datastore.sync.chained]";

	_abort_ = false;

	var items = Datastore.data.all("registrations").filter( function(el){ return !el.uploaded } );

	async.series([
		
		/// 1. extract files (images), add to imageQueue, clean product-obj -> _imagerw
		function(cb){
			console.log('---------------------------------------------------- 1 Run');		
			processProductImages(items, cb);
			//cb();
		},

		(cb) => { _abort_ ? cb(true, {"msg":"aborted (1)"}) : cb(false); },

		// 2. Run two-way sync
		function(cb){
			console.log('---------------------------------------------------- 2 Run');
			_buffer += "Starting Two-way Sync\n";
			
			self.setState({working:true, show_log:true});
			SyncRoutine.Run(
				// progress:
				function(step, steps, table){
					console.log("[Calee] SyncProgress: ", step, steps, table);
					_buffer += step +"/"+ steps +" : Mirrored "+ table +"\n";

					// 3 / 6 = 0.5 * 100 = 50
					var percent =  (step / steps) * 100;

					self.setState({progress_message:_buffer, progress:percent});
				},
				// completion
				function(msg, error){
					console.log("[Calee] SyncComplete: ", msg );
					if( error ){
						_buffer = msg;
					}else{
						//_buffer += msg +"\n";
						_buffer += "Sync done.\n\n";
					}
					self.setState({progress_message:_buffer, working:false, progress:0});
					console.log('---------------------------------------------------- 2 END');
					cb();
				},
				// mode:
				"sync"
			);
			
		},

		(cb) => { _abort_ ? cb(true, {"msg":"aborted (2)"}) : cb(false); },

		// 3. Upload data
		function(cb){
			console.log('---------------------------------------------------- 3 Run');

			_buffer += "Starting Upload\n";
			
			self.setState({working:true, show_log:true});
			SyncRoutine.Run(
				// progress:
				function(step, steps, table){
					console.log("[Calee] UploadProgress: ", step, steps, table);
					_buffer += step +"/"+ steps +" : "+ table +"\n";

					// 3 / 6 = 50
					var percent =  (step / steps) * 100;

					self.setState({progress_message:_buffer, progress:percent});
				},
				// completion
				function(msg, error){
					console.log("[Calee] UploadComplete: ", msg );
					if( error ){
						_buffer = msg;
					}else{
						//_buffer += msg +"\n";	
						_buffer += "Upload done.\n";
					}
					self.setState({progress_message:_buffer, working:false, progress:0});
					console.log('---------------------------------------------------- 3 END');
					cb();
				},
				// mode:
				"upload"
			);
		},

		(cb) => { _abort_ ? cb(true, {"msg":"aborted (3)"}) : cb(false); },

		// 4. Upload all items in imageQueue
		function(cb){
			console.log('---------------------------------------------------- 4 Run');
			
			self.setState({working:true, show_log:false, show_dl:false, show_ul:true, progress_dl:0});
			uploadImageQueue("products",
				function progress(pct){
					console.log("upload progress", pct);
					self.setState({working:true, show_log:false, show_dl:false, show_ul:true, progress_dl:pct});
				},
				function complete(){
					console.log("upload done");
					console.log('---------------------------------------------------- 4 END');
					//console.log('imageQueue: ', Datastore.data.all("imageQueue") );
					cb();
				}
			);
		},

		(cb) => { _abort_ ? cb(true, {"msg":"aborted (4)"}) : cb(false); },

		// 5. download remote product images
		function(cb){
			console.log('---------------------------------------------------- 5 Run');

			listMissingImages("products", ["300x300"], ["front", "back", "left", "right"], function(urls){
				console.log('urls', urls);

				if( urls.length == 0 ){
					return cb();
				}

				var done   = [];
				var failed = [];

				Datastore.dl({
						urls:urls,
						force:true,
						directory:'products'
					},
					function(err, res){
						console.log('[STD] Proxied OnAllDone', err, res);
						console.log('failed', failed );
						setTimeout(function(){
							self.setState({working:false, show_dl:false, progress_dl:0, progress_dlcurr:0});
						}, 2500);
						console.log('---------------------------------------------------- 5 END');
						cb(null, done, failed);
					},
					function(message){ 
						console.log("Proxied OnStepComplete", message);
						var filename = message.filename;
						if( done.indexOf(filename) < 0 ){
							done.push(filename);
						}
						var percent = (done.length / urls.length) * 100;
						self.setState({progress_dl:percent});
					},
					function(message){ 
						console.log("Proxied OnStepFail", message);
						failed.push( message.url );
						var filename = message.url.split("/").slice(-1)[0];
						if( done.indexOf(filename) < 0 ){
							done.push(filename);
						}
						var percent = (done.length / urls.length) * 100;
						self.setState({progress_dl:percent});
						
					},
					function(message){ 
						console.log("Proxied OnStepProgress", message);
						var percent = parseFloat(message.pct) * 100;
						self.setState({progress_dlcurr:percent});
					}
				);
			});
		},

		(cb) => { _abort_ ? cb(true, {"msg":"aborted (5)"}) : cb(false); },

	],
	function(err, res){
		console.log('*******************************************');
		console.log('post series', err, res);
		console.log('*******************************************');

		self.setState({working:false, show_log:false, show_dl:false, show_ul:false, progress_dl:0});

		//var now = moment().format('MMMM Do YYYY, hh:mm:ss');
		var now = "just now (moment is broken?)";
		var reg = {date:now, registrations:items, err:err, result:res};
		console.log('reg:', reg);

		Datastore.data.add("synclog", reg);
		cb(err, res);
	});
}
