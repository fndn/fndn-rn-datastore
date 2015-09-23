//var pack 					= require('./package.json'); // somehow fails :|

module.exports.native 		= require('react-native').NativeModules.fndn_rn_datastore;


/// configuration (private)
var private_opts = {

	// Internal localOnly
	localOnlyTables: ["imageQueue", "synclog", "ready"]
}

/// configuration (public)
var opts = {

	data: {
		// Store everything in this (local) database.
		database: 'whofw-dev-0005',

		// Create AsyncStore backends for these tables
		// and Datastore.Sync will keep these synchronised with the server
		// IMPORTANT: This list should be kept in sync with the models defined on the server
		tables: ["countries", "locations", "brands", "incomeTypes", "storeTypes", "ageGroups", "products"],

		// Sync will only upload entries in these tables (but not pull changes)
		uploadOnly: ["registrations"],

		// Create these tables but not sync or upload them
		localOnly: ["credentials", "imageQueue", "synclog"],


	},

	net: {

		// remote server (ip address and port)
		remotehost: 'http://127.0.0.1:8080',

		// simple token pre-authorized by server
		auth_token: 'fr9a7as792jjd0293hddxonxo0x1309210cpdshcpihvq0823t373e4463',

		// Network timeout (browser defaults are typically 2 mins)
		timeout: (2 * 60 * 1000),

		// internal webserver hostname (dont change)
		localhost: 'http://127.0.0.1',

		// internal webserver port
		localport: 8899,

		// internal webserver bonjour-name
		localbonjour: 'fndn-rn-datastore-bonjour'
	}
}

module.exports.opts = (conf) => {

	if( conf && conf.data ){
		Object.keys(conf.data).forEach( function(ck){
			if( ck == 'localOnly' ){
				conf.data[ck] = conf.data[ck].concat(private_opts.localOnlyTables);
			}
			opts.data[ck] = conf.data[ck];
		});
	}
	
	if( conf && conf.net ){
		Object.keys(conf.net).forEach( function(ck){
			opts.net[ck] = conf.net[ck];
		});
	}



	return opts;
}

// ios
module.exports.ws 			= require('./lib/native.webserver.ios.js');
module.exports.fs 			= require('./lib/native.filesystem.ios.js');
module.exports.dl 			= require('./lib/native.download.ios.js');
module.exports.up 			= require('./lib/native.upload.ios.js');
module.exports.sync 		= require('./lib/native.sync.ios.js');

// generic
module.exports.data 		= require('./lib/datastore.js');
module.exports.reach 		= require('./lib/reach.js');
module.exports.md5 			= require('./lib/md5_mod.js'); 
module.exports.shortid 		= require('shortid');
module.exports.xhr 			= require('xhr');
module.exports.clone 		= module.exports.data.cloneObject;
module.exports.M 			= {};	// memory store

/// Tests							
module.exports.test_native 	= require('./test_native.js');
module.exports.test_data 	= require('./test_data.js');
module.exports.test_reach 	= require('./test_reach.js');

if (!Object.observe) require("object.observe");
Object.observe(module.exports.M, function(changes){
	console.log('M:', module.exports.M);
});

module.exports.info = function(){
	/*
	module.exports.fs.paths( function(err, res){
		console.log( pack.name 
		+ " v."+ pack.version 
		+" using db: "+ opts.data.database 
		+", remote: "+ opts.net.remotehost
		+", local: "+ opts.net.localhost +':'+ opts.net.localport
		+", documents:"+ res.documents
	);
	});
	*/
}
