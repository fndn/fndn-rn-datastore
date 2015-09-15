//var pack 	= require('./package.json'); // somehow fails :|

var native = module.exports.native 	= require('react-native').NativeModules.fndn_rn_datastore;
//var native = module.exports.native = require('NativeModules').fndn_rn_datastore;



module.exports.ws 			= require('./lib/native.webserver.ios.js');
module.exports.fs 			= require('./lib/native.filesystem.ios.js');
module.exports.dl 			= require('./lib/native.download.ios.js');
module.exports.up 			= require('./lib/native.upload.ios.js');
module.exports.data 		= require('./lib/datastore.js');
module.exports.reach 		= require('./lib/reach.js');

/// Tests							
module.exports.test_native 	= require('./test_native.js');
module.exports.test_data 	= require('./test_data.js');
module.exports.test_reach 	= require('./test_reach.js');


/// configuration
module.exports.opts = {

	data: {
		// Store everything in this (local) database.
		database: 'whofw-dev-0002',

		// Create AsyncStore backends for these tables
		// and Datastore.Sync will keep these synchronised with the server
		// IMPORTANT: This list should be kept in sync with the models defined on the server
		tables: ["countries", "locations", "brands", "incomeTypes", "storeTypes", "ageGroups", "products"],

		// Sync will only upload entries in these tables (but not pull changes)
		uploadOnly: ["registrations"],

		// Create these tables but not sync or upload them
		localOnly: ["credentials", "imageQueue"]
	},

	net: {

		// remote server (ip address and port)
		remotehost: 'http://127.0.0.1:8080',

		// Network timeout (browser defaults are typically 2 mins)
		timeout: (2 * 60 * 1000),

		// internal webserver ip
		localhost: 'http://127.0.0.1',

		// internal webserver port
		localport: 8899,

		// internal webserver bonjour-name
		localbonjour: 'fndn-rn-datastore-bonjour'
	}
}

module.exports.info = function(){
	console.log("info");
	
	//console.log({
	//	name: pack.name,
	//	version: pack.version,
	//	remote: remotehost()
	//});
}

/*
module.exports.localstore = {
	// Store everything in this (local) database.
	database: 'whofw-dev-0001',

	// Create AsyncStore backends for these tables
	// and Datastore.Sync will keep these synchronised with the server
	// IMPORTANT: This list should be kept in sync with the models defined on the server
	tables: ["countries", "locations", "brands", "incomeTypes", "storeTypes", "ageGroups", "products"],

	// Sync will only upload entries in these tables (but not pull changes)
	uploadOnly: ["registrations"],

	// Create these tables but not sync or upload them
	localOnly: ["credentials", "imageQueue"]
}

// ip address (and port) of the remote server
var _remotehost = 'http://127.0.0.1:8080';
var remotehost = module.exports.remotehost = function(p){
	if( p ) _remotehost = p;
	return _remotehost;
}


// Network timeout (browser defaults are typically 2 mins)
var _timeout = 2 * 60 * 1000;
var timeout = module.exports.timeout = function(p){
	if( p ) _timeout = p;
	return _timeout;
}




// internal webserver port
var _port = 8899;
var port = module.exports.port = function(p){
	if( p ) _port = p;
	return _port;
}

// internal webserver hostname
var _host = 'http://127.0.0.1';
var host = module.exports.host = function host(){
	return _host +':'+ port();
}

// internal webserver bonjour-name
var _bonjourName 	= 'fndn-rn-datastore-bonjour';
var bonjourName = module.exports.bonjourName = function(p){
	if( p ) _bonjourName = p;
	return _bonjourName;
}

module.exports.options = function(_opts){
	var opts = _opts || {};
	if( opts.port ) _port = opts.port;
	if( opts.remotehost ) _remotehost = opts.remotehost;
}

module.exports.info = function(){
	console.log("info");
	
	//console.log({
	//	name: pack.name,
	//	version: pack.version,
	//	remote: remotehost()
	//});
}
*/