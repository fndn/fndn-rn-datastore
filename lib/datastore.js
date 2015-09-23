var ds 					= require('../');
var ReactNativeStore 	= require('./react-native-store');

var Data 	 			= {tables:{}}; 	// memorymapped async store

var _instance 			= false; 		// ensure singleton
var _initialized 		= -1; 			// -1: not ready, 0:loading, 1: ready
var _init_queue 		= [];

var _subscribers 		= {};
var _lastAnnoncement 	= Date.now();


module.exports.ready = _initialized;

module.exports.init = function( cb ){
	//console.log('= Local: init (_instance:', _instance, "_initialized:", _initialized, ")");
	if( !_instance ){
		_instance = true;
		_initialized = 0;
		//console.log('= Local: initializing Datastore');

		if( cb ) _init_queue.push(cb);

		ReactNativeStore.setDbName( ds.opts().data.database );

		_setup();

	}else{
		_init_queue.push(cb);
	}
}

function _process_init_queue(){

	_initialized = 1;

	//console.log("= Datastore: _process_init_queue", _init_queue);

	if( _init_queue.length ){
		//console.log("= Local: Processing Queue");
		for(var fn in _init_queue ){
			console.log('[Datastore] Calling Queued fn', _init_queue[fn]);
			_init_queue[fn]();
		}
		_init_queue = [];
	}
	console.log("                                                                                                                    ");
	console.log("[Datastore] Ready");
	console.log('--------------------------------------------------------------------------------------------------------------------');
}

function _setup(){
	//console.log('= Local: Creating Tables:');

	var _tables = new Array();
	_tables = _tables.concat(ds.opts().data.tables);
	_tables = _tables.concat(ds.opts().data.uploadOnly);
	_tables = _tables.concat(ds.opts().data.localOnly);

	ReactNativeStore.prepare(_tables, function(err, res){
		console.log("[Datastore] Preparing DataTables");

		// create one model pr table
		Object.keys(res).forEach( function(rk){
			Data.tables[rk] = ReactNativeStore.modelify(rk, res[rk] );
			console.log("[Datastore]   + "+ rk);

			//Data.tables[rk].removeAll();
		});
		console.log("[Datastore] Connected Models");
		console.log('[Datastore Setup complete]');
		console.log('--------------------------------------------------------------------------------------------------------------------');
		

		_process_init_queue();
	});
}



/// CRUD

var Q = (fn) => {
	_init_queue.push( fn );
}


// add obj to table
var add = module.exports.add = (table, val) => {
	console.log('% add', table, val);

	// add hash
	val.hash = ds.hash(val);

	var val = Data.tables[table] ? {insert_id: Data.tables[table].add(val)} : false;

	_announceChange(table);
	return val;
}


/*
// add obj to table
var add = module.exports.add = (table, val) => {
	console.log('% add', table, val);
	var val = Data.tables[table] ? {insert_id: Data.tables[table].add(val)} : false;

	_announceChange(table);
	return val;
}
*/
// add unique
var addu = module.exports.addu = (table, val) => {
	//console.log('% addu', table, val);

	if( !Data.tables[table] ){
		console.log('% addu 0: table not found ('+ table +')' );
		return false;
	}else{

		var r = Data.tables[table].where(val).find();
		//console.log('% addu 1', r);
		if( r.length > 0 ){
			//console.log('% addu 2: record exist. Aborting! ('+ r +')' );
			return false;
		}else{
			var val = {insert_id: Data.tables[table].add(val)};
			_announceChange(table);
			return val;
		}
	}
}

// update obj in table
var put = module.exports.put = (table, key, val) => {
	//console.log('% put', table, key, val);

	if( !Data.tables[table] ){
		console.log('% put 0: table not found ('+ table +')' );
		return false;
	}else{
		// find record 
		var r = Data.tables[table].where(key).find();
		//console.log('% put 1', r);
		if( r.length == 0 ){
			console.log('% put 2: No records matches key', key);
			return false;
		}

		r = r[0]; // select first (the add() function should have prevented duplicates anyway)

		// merge with val
		Object.keys(val).forEach( function(vk){
			r[vk] = val[vk];
		});

		Data.tables[table].updateById( r._id, r);

		_announceChange(table);
		return r;
	}
}

// delete one record from table (key should be unique)
var del = module.exports.del = (table, key) => {
	console.log('% del', key);
	if( !Data.tables[table] ){
		console.log('% del 0: table not found ('+ table +')' );
		return false;
	}else{
		var r = Data.tables[table].where(key).find();
		console.log('% del 1', r);
		if( r.length == 0 ){
			console.log('% del 2: No records matches key', key);
			return false;
		}else if( r.length > 1 ){
			console.log('% del 3: Multiple records matches key', key);
			return false;
		}else{
			r = r[0];
			var val = {removed_id: Data.tables[table].removeById( r._id )[0] };
			_announceChange(table);
			return val;
		}
	}
}

// delete all matches
var delall = module.exports.delall = (table, key) => {
	console.log('% delall', key);
	if( !Data.tables[table] ){
		console.log('% delall 0: table not found ('+ table +')' );
		return false;
	}else{
		var r = Data.tables[table].where(key).find();
		console.log('% delall 1', r);
		if( r.length == 0 ){
			console.log('% delall 2: No records matches key', key);
			return false;
		}else{
			var ids = [];
			r.forEach( function(ar){
				ids.push( Data.tables[table].removeById( ar._id )[0] );
			});
			_announceChange(table); // the default $last value might not be very useful here
			return {removed_ids: ids };
		}
	}
}

// get first record that mathes key
var one = module.exports.one = (table, key) => {
	console.log('% one', key);
	if( !Data.tables[table] ){
		console.log('% one 0: table not found ('+ table +')' );
		return false;
	}else{
		var r = Data.tables[table].where(key).find();
		console.log('% one 1: records matching key', key, r);
		if( r.length == 0 ){
			console.log('% one 2: No records matches key', key);
			return false;
		}else{
			console.log('% one 3: Returning first record that matches key', key);
			return r[0];
		}
	}
}

// get first record that mathes key
var last = module.exports.last = (table, key) => {
	//console.log('% last', table);
	if( !Data.tables[table] ){
		console.log('% last 0: table not found ('+ table +')' );
		return false;
	}else{
		return (Data.tables[table].findAll()).slice(-1)[0];
	}
}


// all records in table
var all = module.exports.all = (table, cb) => {

	if( !_initialized ){
		//_init_queue.push(function(){ all(table, cb) });
		Q(function(){ all(table, cb) });
		return;
	}
	

	console.log('% all', table);

	var res = Data.tables[table] ? Data.tables[table].findAll() : [];
	
	if( cb ){ cb(res) }else{ return res	};
}



// remove all records from table
var empty = module.exports.empty = (table) => {
	console.log('% empty', table);
	return Data.tables[table] ? {removed_ids: Data.tables[table].removeAll()} : false;
}

// remove all records from table and reset autoincrement
var reset = module.exports.reset = (table) => {
	console.log('% reset', table);
	if( !Data.tables[table] ){
		console.log('% reset 0: table not found ('+ table +')' );
		return false;
	}
	Data.tables[table].removeAll();
	Data.tables[table].databaseData[table].autoinc = 1;

	//_announceChange(table);
	return Data.tables[table].databaseData[table].autoinc;
}

// number of records in table
var count = module.exports.count = (table) => {
	return Data.tables[table] ? Data.tables[table].databaseData[table].totalrows : -1;
}

var countWhereNo = module.exports.countWhereNo = (table, key) => {
	//console.log('countWhereNo table', table);
	//console.log('countWhereNo Data.tables[table]', Data.tables[table]);
	
	var items = Data.tables[table].findAll();
	//console.log('items', items);

	items = items.filter( function(el){ return !el[key] } );
	return items.length;
}

// find where
var where = module.exports.where = (table, query, cb) => {
	
	console.log('% where', table, query);

	if( !_initialized ){
		//_init_queue.push(function(){ all(table, cb) });
		Q(function(){ where(table, query, cb) });
		return;
	}

	console.log('% where', table, query);

	
	var res = Data.tables[table].where(query).find();
	
	if( cb ){ cb(res) }else{ return res	};
}




/// Utils

// fast shallow object cloner
var cloneObject = module.exports.cloneObject = (o) => {
	if (o === null || typeof o !== 'object') return o;
	
	var r = {};
	
	for(var k in o)	r[k]=o[k]
	
	return r;
};

// order a list by key. (set $direction to -1 to reverse it)
var orderBy = module.exports.orderBy = (arr, key, _direction) => {
	var direction = (_direction != undefined) ? _direction : 1;
	//return (direction > 0) ? sortByKey(arr, key) : sortByKey(arr, key).reverse();
	return (direction > 0) ? sortByKeyAlphanumCaseSensitive(arr, key) : sortByKeyAlphanumCaseSensitive(arr, key).reverse();

}
var sortByKey = (array, key) => {
	return array.sort(function(a, b) {

		if( !a.hasOwnProperty(key) || !a.hasOwnProperty(key) ){
			return false;
		}

		var x = a[key];
		var y = b[key];

		if (typeof x == "string")
		{
			x = x.toLowerCase(); 
			y = y.toLowerCase();
		}

		return ((x < y) ? -1 : ((x > y) ? 1 : 0));
	});
}

var sortByKeyAlphanumCaseSensitive = (array, key) => {
	return array.sort(function(a, b) {

		if( !a.hasOwnProperty(key) || !a.hasOwnProperty(key) ){
			return false;
		}

		var x = a[key];
		var y = b[key];

		return alphanum(x,y);

		/*
		if (typeof x == "string")
		{
			x = x.toLowerCase(); 
			y = y.toLowerCase();
		}

		return ((x < y) ? -1 : ((x > y) ? 1 : 0));
		*/
	});
}

/// http://www.davekoelle.com/files/alphanum.js
function alphanum(a, b) {
  function chunkify(t) {
	var tz = new Array();
	var x = 0, y = -1, n = 0, i, j;

	while (i = (j = t.charAt(x++)).charCodeAt(0)) {
	  var m = (i == 46 || (i >=48 && i <= 57));
	  if (m !== n) {
		tz[++y] = "";
		n = m;
	  }
	  tz[y] += j;
	}
	return tz;
  }

  var aa = chunkify(a);
  var bb = chunkify(b);

  for (x = 0; aa[x] && bb[x]; x++) {
	if (aa[x] !== bb[x]) {
	  var c = Number(aa[x]), d = Number(bb[x]);
	  if (c == aa[x] && d == bb[x]) {
		return c - d;
	  } else return (aa[x] > bb[x]) ? 1 : -1;
	}
  }
  return aa.length - bb.length;
}


/*

***********************************************

TODO: Build a proper recursive function for this

***********************************************

// remove _id's from object OR array-of-objects
var removeids = module.exports.removeids = (inp) => {
	console.log('removeids', typeof inp, inp.length );
	if( inp.length !== undefined ){
		// is array
	}else{
		// is object
	}
}
*/

function remove_ids(objArr){

	//console.log('---------- IN ----------');
	//console.log(objArr);
	//console.log('------------------------');

	if( objArr == undefined ) return objArr;

	if( !objArr.length ){
		return _remove_ids( objArr ); 
	}

	var rarr = {};
	for(var a in objArr){
		var robj = {};
		//console.log('remove_ids > typeof objArr[a]', typeof objArr[a], objArr[a]);
		if( objArr[a] == null || typeof objArr[a] != 'object' ){
			rarr[a] = objArr[a];
		}else{
			var keys = Object.keys( objArr[a] );
			for( var k in keys ){
				var key = keys[k] 
				if( key != '_id' ){
					robj[ key ] = _remove_ids( objArr[a][key] ); 
				}
			}
			rarr[a] = robj;
		}
	}
	//console.log('---------- OUT ----------');
	//console.log(rarr);
	//console.log('--------------------------');

	return rarr;
}
function _remove_ids(obj){
	//console.log('_remove_ids > typeof obj', typeof obj, obj);
	if( obj == null || typeof obj != 'object' ) return obj;
	
	var robj = {};
	var keys = Object.keys( obj );
	for( var k in keys ){
		var key = keys[k];
		if( key != '_id' ){
			robj[ key ] = obj[key]; 
		}
	}
	return robj;
}
module.exports.removeIDs = remove_ids;


/*

***********************************************

TODO: Connect to add, put and del methods

***********************************************

*/

var subscribe = module.exports.subscribe = function(table, fn_subscriber){

	if( _initialized == 0 ){
		console.log('################## DS subscribe deferring');
		_init_queue.push(function(){
			subscribe(table, fn_subscriber);
		});
		return;
	}

	console.log('[Datastore] add subscriber to', table );

	if( Object.keys(_subscribers).indexOf(table) < 0 ){
		_subscribers[table] = [];
	}

	if( _subscribers[table].indexOf(fn_subscriber) < 0 ){
		_subscribers[table].push( fn_subscriber );
	}
}

function _announceChange(table){
	//console.log('_announceChange() typeof _subscribers[table]:', typeof _subscribers[table], _subscribers[table], "since:", (Date.now() - _lastAnnoncement), "length:", _subscribers[table].length, "Object.keys(_subscribers).indexOf(table):", Object.keys(_subscribers).indexOf(table) );
	//console.log('_announceChange()', table, _subscribers[table].length);

	if( Object.keys(_subscribers).indexOf(table) < 0 ) return;
	if( typeof _subscribers[table] != 'object') return;
	if( _subscribers[table].length == 0) return;

	// do we need the throttle?
	//if( Date.now() - _lastAnnoncement < 1000 ) return;

	for( var fn in _subscribers[table] ){
		//console.log('_announceChange() ANNONUNCING', table);
		_subscribers[table][fn]( last(table) );
	}
	_lastAnnoncement = Date.now();
}



