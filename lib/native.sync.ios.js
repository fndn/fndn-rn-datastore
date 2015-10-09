var Datastore 	= require('fndn-rn-datastore');

var SyncRoutine = require('./native.sync.routine.ios.js');
var async 		= require('async');
var moment 		= require('moment');

var _abort_ 	= false;


///NOTE: This is really a userland method... can we move it there?
var prepareRegistrations = function(cb){

	Datastore.data.empty("register");

	var items = Datastore.data.all("registrations");
	console.log('[prepareRegistrations] @begin all registrations', items);

	items = items.filter( function(el){
		//console.log('@prepareRegistrations: Filtering items ', el.uploaded, Object.keys(el).indexOf('uploaded') );
		//return true;
		return Object.keys(el).indexOf('uploaded') === -1;
	});


	//console.log('[prepareRegistrations] 2 All registrations', items);

	for(var i=0; i<items.length; i++){
		//console.log(' items[i]:', items[i]);

		var reg = {
			nut_100g_energyKj 					:'',
			nut_100g_energyKcal 				:'',
			nut_100g_fat 						:'',
			nut_100g_fatOfWhichSaturates		:'',
			nut_100g_fatOfWhichTrans 			:'',
			nut_100g_carbohydrate 				:'',
			nut_100g_carbohydrateOfWhichSugars 	:'',
			nut_100g_carbohydrateOfWhichLactose :'',
			nut_100g_protein 					:'',
			nut_100g_salt 						:'',
			nut_100g_sodium 					:'',
		
			nut_serv_servingSize 				:'',
			nut_serv_energyKj 					:'',
			nut_serv_energyKcal 				:'',
			nut_serv_fat 						:'',
			nut_serv_fatOfWhichSaturates		:'',
			nut_serv_fatOfWhichTrans 			:'',
			nut_serv_carbohydrate 				:'',
			nut_serv_carbohydrateOfWhichSugars 	:'',
			nut_serv_carbohydrateOfWhichLactose :'',
			nut_serv_protein 					:'',
			nut_serv_salt 						:'',
			nut_serv_sodium 					:'',
		};

		var images = items[i].product.imgstore;
		//console.log(' images:', images);

		for(var f in images){
			var f = images[f];
			
			if( f === null ){
				//console.log('f', f);
				items[i].product.hasImages = false;
			
			}else{

				var path = f.path.split("/").slice(-1)[0];
				var o = {id:items[i].product.uuid, uploaded:false, name:f.name, model:'products', path:path};
				//console.log("[prepareRegistrations] >> imageQueue id:", items[i].product.uuid, o );

				Datastore.data.addu("imageQueue", o );
				items[i].product.hasImages = true;

				// http://127.0.0.1:8090/pub/products/img/N1TI2Fkll-right-300x300.jpg
				reg['img_'+ o.name] 	= o.id +'-'+ o.name +'.jpg';
				reg['img_'+ o.name +'_url'] = '/pub/products/'+ o.id +'-'+ o.name +'-1136x640.jpg';
			}
		}

		
		reg.name 						= items[i].name;
		reg.hash 						= items[i].hash;
		reg.time 						= items[i].timeOfRegistration;
		reg.adr_city 					= items[i].location.city;
		reg.adr_street 					= items[i].location.street;
		reg.adr_neighbourhood			= items[i].location.neighbourhood;
		reg.adr_country 				= items[i].location.country;
		reg.adr_countryCode 			= items[i].location.countryCode;
		reg.adr_incomeType 				= items[i].location.incomeType;
		reg.adr_storeBrand 				= items[i].location.storeBrand;
		reg.adr_storeType 				= items[i].location.storeType;
		reg.prd_name 					= items[i].product.name;
		reg.prd_agegrp 					= items[i].product.ageGroup;
		reg.prd_type 					= items[i].product.foodType;
		reg.prd_brand 					= items[i].product.brand;
		reg.usr_reporter 				= items[i].credentials.name;
		reg.usr_affiliation 			= items[i].credentials.affiliation;
		reg.pkg_cartoons				= items[i].product.visualInformation.cartoons;
		reg.pkg_children				= items[i].product.visualInformation.picturesOfInfantsOrYoungChildren;
		reg.pkg_mother					= items[i].product.visualInformation.picturesOfMothers;
		reg.pkg_cclaims					= items[i].product.visualInformation.comparativeClaims;
		reg.pkg_hclaims					= items[i].product.visualInformation.healthClaims;

		if( items[i].promotion ){
			reg.pro_freeGiveAways 		= items[i].promotion.freeGiveAways;
			reg.pro_multiBuyDiscount 	= items[i].promotion.multiBuyDiscount;
			reg.pro_otherTextOnPackage 	= items[i].promotion.otherTextOnPackage || '';
			reg.pro_priceReduction 		= items[i].promotion.priceReduction;
		}

		if( items[i].price ){
			reg.prc_current 			= items[i].price.currentPrice 			|| '';
			reg.prc_normal  			= items[i].price.normalPrice 			|| '';
			reg.prc_currency 			= items[i].price.currency 				|| '';
		}
		
		if( items[i].gpsLocation && items[i].gpsLocation.coords ){
			reg.adr_lat 				= items[i].gpsLocation.coords.latitude;
			reg.adr_lng 				= items[i].gpsLocation.coords.longitude;
			reg.adr_elv 				= items[i].gpsLocation.coords.altitude;
			reg.adr_posacc 				= items[i].gpsLocation.coords.accuracy;
			reg.adr_elvacc 				= items[i].gpsLocation.coords.altitudeAccuracy;
		}

		if( items[i].product.nutritionalPr100g ){
			reg.nut_100g = {};
			Object.keys(items[i].product.nutritionalPr100g).forEach( function(k){
				//reg.nut_100g[k] = items[i].product.nutritionalPr100g[k];
				reg['nut_100g_'+k] = items[i].product.nutritionalPr100g[k];
			});
		}

		if( items[i].product.nutritionalPrServing ){
			reg.nut_serving = {};
			Object.keys(items[i].product.nutritionalPrServing).forEach( function(k){
				//reg.nut_serving[k] = items[i].product.nutritionalPrServing[k];
				reg['nut_serv_'+ k] = items[i].product.nutritionalPrServing[k];
			});
		}

		console.log('[prepareRegistrations] commit registration:', reg);
		Datastore.data.addu("register", reg);
	}

	// Show imageQueue
	console.log("[prepareRegistrations] @end imageQueue:", Datastore.data.all("imageQueue") );
	console.log("[prepareRegistrations] @end register:", Datastore.data.all("register") );

	cb(null, "success");
}

/// $tablename : which table does the items belong to (becomes folder on server)
/// $items : array of {name,path} objs
var uploadImageQueue = module.exports.uploadImageQueue = function(tablename, items, progress_cb, complete_cb){
	console.log('[uploadImageQueue] @begin all items:', items );
	_uploadImageQueue_step(tablename, items, items.length, progress_cb, complete_cb);
}

function _uploadImageQueue_step(table, items, itemsStartcount, progress_cb, complete_cb){
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
			//console.log('upload ERROR', err, res);
			Datastore.data.put("imageQueue", {id:itm.id}, {uploaded:true, failed:true} );

		}else{
			console.log('upload OK', res);
			console.log('/pub/products/img/'+ res.id +'-'+ itm.name +'-300x300.jpg');
			//console.log('Mark the imageQueue record as uploaded. idx:', {id:res.id, name:res.files[0]} );
			//Datastore.data.put("imageQueue", {id:res.id, name:res.files[0]}, {uploaded:true} );
			Datastore.data.delall("imageQueue", {id:res.id, name:itm.name});

			// Find path to original
			var pimg = Datastore.data.one("products", {uuid:res.id}).imgstore;
			//console.log('p img', pimg);
			for( var im in pimg ){
				if( pimg[im].name == itm.name ){
					console.warn("TODO: Delete "+ pimg[im].path );
				}
			}
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


/// The main sync routine
var chained = module.exports.chained = function(self, final_cb){
	var _buffer = "";

	_abort_ = false;

	//var items = Datastore.data.all("registrations").filter( function(el){ return !el.uploaded } );

	async.series([
		
		/// OK
		/// 1. extract files (images) to imageQueue, copy records from Registrations to Register, clean data
		function(cb){
			console.log('---------------------------------------------------- 1 Run');		
			prepareRegistrations(cb);
		},
	
		
		(cb) => { _abort_ ? cb(true, "aborted (1)") : cb(null, "success @proceed-1"); },
		
		/// OK
		// 2. Run two-way sync
		function(cb){
			console.log('---------------------------------------------------- 2 Run');
			_buffer += "Starting Two-way Sync\n";
			
			self.setState({working:true, show_log:true});
			SyncRoutine.Run(
				// progress:
				function(step, steps, table){
					//console.log("[Calee] SyncProgress: ", step, steps, table);
					_buffer += step +"/"+ steps +" : Mirrored "+ table +"\n";

					// 3 / 6 = 0.5 * 100 = 50
					var percent =  (step / steps) * 100;

					self.setState({progress_message:_buffer, progress:percent});
				},
				// completion
				function(err, res){
					//console.log("[Calee] SyncComplete: ", err, res );
					if( err ){
						_buffer = res;
					}else{
						//_buffer += msg +"\n";
						_buffer += "Sync done.\n\n";
					}
					self.setState({progress_message:_buffer, working:false, progress:0});
					console.log('---------------------------------------------------- 2 END');
					//cb(err, res);

					if( err ){
						cb(true, "error");
					}else{
						cb(null, "success");
					}
				},
				// mode
				"sync"
			);			
		},
		
		
		(cb) => { _abort_ ? cb(true, "aborted (2)") : cb(null, "success @proceed-2"); },
		
		
		/// OK (even correctly refuses to register duplicates)
		/// 3. Upload data
		function(cb){
			console.log('---------------------------------------------------- 3 Run');

			_buffer += "Starting Upload\n";
			
			self.setState({working:true, show_log:true});
			SyncRoutine.Run(
				// progress:
				function(step, steps, table){
					console.warn("[Calee] UploadProgress: ", step, steps, table);
					_buffer += step +"/"+ steps +" : "+ table +"\n";

					// 3 / 6 = 50
					var percent =  (step / steps) * 100;

					self.setState({progress_message:_buffer, progress:percent});
				},
				// completion
				function(err, res){
					console.log("[Calee] UploadComplete: ", res );
					if( err ){
						_buffer = res;
					}else{
						_buffer += "Upload done.\n";
					}
					self.setState({progress_message:_buffer, working:false, progress:0});
					console.log('---------------------------------------------------- 3 END');
					cb(err, res);
				},
				// mode:
				"upload"
			);
		},
		
	
		(cb) => { _abort_ ? cb(true, "aborted (3)") : cb(null, "success @proceed-3"); },
		
		/// OK
		/// 4. Upload imageQueue
		function(cb){
			console.log('---------------------------------------------------- 4 Run');

			var items = Datastore.data.all('imageQueue');

			self.setState({working:true, show_log:false, show_dl:false, show_ul:true, progress_dl:0});
			uploadImageQueue("products", items,
				function progress(pct){
					console.log("upload progress", pct);
					self.setState({working:true, show_log:false, show_dl:false, show_ul:true, progress_dl:pct});
				},
				function complete(){
					//console.log("upload done");
					console.log('imageQueue: ', Datastore.data.all("imageQueue") );
					console.log('---------------------------------------------------- 4 END');
					cb(null, "success");
				}
			);
		},
		
		
		(cb) => { _abort_ ? cb(true, "aborted (4)") : cb(null, "success @proceed-4"); },
		
		
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
						//console.log('[STD] Proxied OnAllDone', err, res);
						console.log('failed', failed );
						setTimeout(function(){
							self.setState({working:false, show_dl:false, progress_dl:0, progress_dlcurr:0});
						}, 2500);
						console.log('---------------------------------------------------- 5 END');
						//cb(null, done, failed);

						if( err ){
							cb(true, "error @"+ res);
						}else{
							cb(null, "success");
						}
					},
					function(message){ 
						//console.log("Proxied OnStepComplete", message);
						var filename = message.filename;
						if( done.indexOf(filename) < 0 ){
							done.push(filename);
						}
						var percent = (done.length / urls.length) * 100;
						self.setState({progress_dl:percent});
					},
					function(message){ 
						//console.log("Proxied OnStepFail", message);
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


		(cb) => { _abort_ ? cb(true, "aborted (5)") : cb(null, "success @COMPLETE"); },

	],
	function(err, res){
		
		console.log('*******************************************');
		
		console.log('Sync completed with result:', err, res);

		if( _abort_ ){
			console.warn('Sync was aborted by user');
		}
	
		if( err ){
			/// There was errors
			console.warn('Sync completed with errors');
		
			for(var i in res){
				if( res[i].split(" ")[0] != 'success' ){
					console.warn( 'Error at step '+ i +':\n', res[i]);
				}
			}
		}
		console.log('*******************************************');

		console.log('ALL imageQueue: ', Datastore.data.all("imageQueue") );
		console.log('ALL register: ', Datastore.data.all("register") );
		console.log('ALL register countWhereNo: '+ Datastore.data.countWhereNo("register", "uploaded") );


		if( !_abort_ || err ){

			var now = moment().format('MMMM Do YYYY, HH:mm:ss');
			var reg = {date:now, err:err, result:res, registrations:[]};

			/// update registrations to reflect $uploaded status of register
			Datastore.data.all("register").forEach( function(r){
				Datastore.data.put("registrations", {hash:r.hash}, {uploaded:true});
				console.log('Marking item in registrations as uploaded:',  r.hash, r);
				reg.registrations.push(r);
			});
			
			Datastore.data.add("synclog", reg);

			Datastore.data._forceAnnounce("registrations");
		}

		console.log('ALL registrations: ', Datastore.data.all("registrations") );

		//self.setState({working:false, show_log:false, show_dl:false, show_ul:false, progress_dl:0});

		final_cb(_abort_, res);

		_abort_ = false;
	});
}
