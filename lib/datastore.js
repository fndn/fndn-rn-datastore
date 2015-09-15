var ds 					= require('../');
var ReactNativeStore 	= require('./react-native-store');

var Data 	 			= {tables:{}}; 	// memorymapped async store

var _instance 			= false; 		// ensure singleton
var _initialized 		= -1; 			// -1: not ready, 0:loading, 1: ready
var _init_queue 		= [];

var _subscribers 		= {};
var _lastAnnoncement 	= Date.now();


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
			console.log('  Local: Calling queued FN', _init_queue[fn]);
			_init_queue[fn]();
		}
		_init_queue = [];
	}
	//console.log("= Local: Ready");	
}


/*
function _setup(){
	console.log('= Local: Creating Tables:');

	var _tables = new Array();
	_tables = _tables.concat(ds.opts().data.tables);
	_tables = _tables.concat(ds.opts().data.uploadOnly);
	_tables = _tables.concat(ds.opts().data.localOnly);

	var len = _tables.length;
	for(var i = 0; i<len; i++){
		ReactNativeStore.table( _tables[i] ).then(function(_table){

			//console.log('_table', _table);

			if( _table.tableName == "registrations"){
				//_table.removeAll();	
			}
			//_table.removeAll(); // reset local store

			//console.log("= Datastore: Connecting table "+ _table.tableName );
			console.log("  + "+ _table.tableName );
			Data.tables[_table.tableName] = _table;
			if( Object.keys(Data.tables).length == len ){
				_process_init_queue();
			}
		});
	}
}
*/

function _setup(){
	//console.log('= Local: Creating Tables:');

	var _tables = new Array();
	_tables = _tables.concat(ds.opts().data.tables);
	_tables = _tables.concat(ds.opts().data.uploadOnly);
	_tables = _tables.concat(ds.opts().data.localOnly);

	ReactNativeStore.prepare(_tables, function(err, res){
		console.log("= Prepared DataTables");

		// create one model pr table (seems NOT to work, but but...)
		Object.keys(res).forEach( function(rk){
			Data.tables[rk] = ReactNativeStore.modelify(rk, res[rk] );

			//Data.tables[rk].removeAll();
		});
		console.log("= Connected Models");
		

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
	return Data.tables[table] ? {insert_id: Data.tables[table].add(val)} : false;
}

// add unique
var addu = module.exports.addu = (table, val) => {
	console.log('% addu', table, val);

	if( !Data.tables[table] ){
		console.log('% addu 0: table not found ('+ table +')' );
		return false;
	}else{

		var r = Data.tables[table].where(val).find();
		//console.log('% addu 1', r);
		if( r.length > 0 ){
			console.log('% addu 2: record exist. Aborting! ('+ r +')' );
			return false;
		}else{
			return {insert_id: Data.tables[table].add(val)};
		}
	}
}

// update obj in table
var put = module.exports.put = (table, key, val) => {
	console.log('% put', table, key, val);

	if( !Data.tables[table] ){
		console.log('% put 0: table not found ('+ table +')' );
		return false;
	}else{
		// find record 
		var r = Data.tables[table].where(key).find();
		console.log('% put 1', r);
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
			return {removed_id: Data.tables[table].removeById( r._id )[0] };
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
	console.log('% last', key);
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
	return Data.tables[table].databaseData[table].autoinc;
}

// number of records in table
var count = module.exports.count = (table) => {
	return Data.tables[table] ? Data.tables[table].databaseData[table].totalrows : -1;
}

var countWhereNo = module.exports.countWhereNo = (table, key) => {
	var items = Data.tables[table].findAll();
	items = items.filter( function(el){ return !el[key] } );
	return items.length;
}

// find where
var where = module.exports.where = (table, query, cb) => {
	

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
var orderBy = module.exports.orderBy = (arr, key, direction) => {
	return (direction > 0) ? sortByKey(arr, key) : sortByKey(arr, key).reverse();
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

/*
TODO
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

Data.countWhereNo = module.exports.countWhereNo = function(_table, key){
	var table = _findTable(_table);
	if( table ){
		var items = table.findAll();
		items = items.filter( function(el){ return !el[key] } );
		return items.length;
	}
}


/// -----------------------------------------------------------------------
/// Utilities
function _findKey( key, obj ){
	if( Object.keys(obj).indexOf(key) > -1 ){
		return obj[key];
	}else{
		//console.log('_findKey '+ key +' in '+ obj +' : NOT FOUND');
		return false;	
	}
}
function _findTable( _table ){
	//console.log( "_findTable", Object.keys(Data.tables) );

	if( Object.keys(Data.tables).indexOf(_table) > -1 ){ // maybe: Datastore.localstore.tables
		return Data.tables[_table];
	}else{
		//console.log('_findTable '+ _table +' : NOT FOUND');
		return false;	
	}
}
module.exports.findTable = _findTable;

*/

// http://stackoverflow.com/a/14463464/1993842

/*
function sortByKey(array, key) {
	return array.sort(function(a, b) {
		var x = a[key]; var y = b[key];
		return ((x < y) ? -1 : ((x > y) ? 1 : 0));
	});
}
*/





















// > module.exports.subscribe = function(table, fn_subscriber){
module.exports.subscribe = function(table, fn_subscriber){
	console.log('[Datastore] add subscriber to', table );

	if( Object.keys(_subscribers).indexOf(table) < 0 ){
		_subscribers[table] = [];
	}

	if( _subscribers[table].indexOf(fn_subscriber) < 0 ){
		_subscribers[table].push( fn_subscriber );
		//console.log('[Datastore] 2 ADD OnChanged', _subscribers );
	}
}
function _announceChange(table){
	//console.log('_announceChange() typeof _subscribers[table]:', typeof _subscribers[table], _subscribers[table], "since:", (Date.now() - _lastAnnoncement), "length:", _subscribers[table].length, "Object.keys(_subscribers).indexOf(table):", Object.keys(_subscribers).indexOf(table) );
	//console.log('_announceChange()', table, _subscribers[table].length);

	if( Object.keys(_subscribers).indexOf(table) < 0 ) return;
	if( typeof _subscribers[table] != 'object') return;
	if( _subscribers[table].length == 0) return;

	//if( Date.now() - _lastAnnoncement < 1000 ) return;

	for( var fn in _subscribers[table] ){
		//console.log('_announceChange() ANNONUNCING', table);
		_subscribers[table][fn]( last(table) );
	}
	_lastAnnoncement = Date.now();
}



















/*

// returns count of items in a table
Data.count = module.exports.count = function(_table){
	var table = _findTable(_table);
	if( table ){
		return table.databaseData[_table].totalrows;
	}
}

Data.countWhereNo = module.exports.countWhereNo = function(_table, key){
	var table = _findTable(_table);
	if( table ){
		var items = table.findAll();
		items = items.filter( function(el){ return !el[key] } );
		return items.length;
	}
}


// findAll, returns list
Data.all = module.exports.all = function(_table, cb){

	if( !_initialized ){
		console.log("adding ds.all@"+ _table +" to _init_queue");
		_init_queue.push(function(){ Data.all(_table, cb) });
		return;
	}

	
	var table = _findTable(_table);
	if( table ){
		
		var obj;

		if( _table == 'registrations' ){
			
			//console.log('### registrations DBB', table );
			obj = table.findAll();

		}else{

			if( _table == 'locations' &&  MemoryStore.country ){
				// filter by country
				//console.log("DATASTORE: FILTERING ", _table, " on MS.COUNTRY", MemoryStore.country.name,  "MemoryStore:", MemoryStore );
				obj = table.where({'country': MemoryStore.country.name}).find();
			
			}else if( _table == 'products' &&  MemoryStore.brand ){
				// filter by brand
				//console.log("CDATASTORE: FILTERING ", _table, " on MS.BRAND", MemoryStore.brand.name,  "MemoryStore:", MemoryStore );
				obj = table.where({'brand': MemoryStore.brand.name}).find();

			}else{
				// un-filtered
				//console.log("DATASTORE: all@"+ _table );
				obj = table.findAll();
			}

			obj = sortByKey(obj, "name");

		}
		

		if( typeof cb == 'function'){
			cb(obj);
		}else{
			return obj;
		}

	}
}
*/
/*
// findOne, returns item
Data.one = module.exports.one = function(_table, _id){
	var table = _findTable(_table);
	if( table ){
		return table.get(_id)[0];
	}
}


// returns the record with highest _id
Data.last = module.exports.last = function(_table){
	var table = _findTable(_table);
	if( table ){
		return (table.findAll()).slice(-1)[0];
	}
}
*/
/*
// create, returns insertID
Data.add = module.exports.add = function(_table, _obj){
	var table = _findTable(_table);
	if( table ){

		//console.log('DS '+ _table +' add _obj', typeof _obj, _obj, "name:", _obj.name);

		//TODO: Do we need a Duplicate check ?

		
		//console.log("adding obj 1:", _obj, typeof _obj, Object.keys(_obj), DefaultData[_table], DefaultData[_table][0]);
		//var schema = DefaultData[_table][0];
		//delete(schema._id);
		////TODO: if no schema...?
		//var obj = {};
		//Object.keys(schema).forEach( function(el){
		//	//console.log(el, _obj[el]);
		//	if( _obj[el] == null || _obj[el] == undefined ){
		//		//console.log('handling nil');
		//		obj[el] = '';
		//	}else{
		//		obj[el] = _obj[el];
		//	}
		//});
		//console.log('Adding', obj, 'to', _table);

		var ok = table.add(_obj);
		//console.log('DS '+ _table +' add _obj >> ', ok);

		setTimeout( function(){ _announceChange(_table) }, 10);
		return ok;
	}
}


// remove, returns insertID(?)
Data.del = module.exports.del = function(_table, _id){
	var table = _findTable(_table);
	if( table ){
		setTimeout( function(){ _announceChange(_table) }, 10);
		return table.removeById(_id);
	}
}




// findOneAndUpdate, updates key (single or object) in an existing record 
Data.put = module.exports.put = function(_table, _id, _key, _val){
	//console.log("Datastore.put() called with", _table, _id, _key, _val);
	var table = _findTable(_table);
	if( table ){
		var data;
		try {
			data = table.get(_id);
		}catch(e){
			//console.log('FIRST PUT Error', e);
			//console.log('  table', table);
			//console.log('  this.databaseData[this.tableName]:', this.databaseData[this.tableName]);
			//return table.add(_key);
			return;
		}

		//console.log("Datastore.put:", _table, data, typeof data );
		if( data == undefined ){
			//console.log("Datastore.put ADDING");
			setTimeout( function(){ _announceChange(_table) }, 10);
			return table.add(_key);
		}else{
			if( data.length > 0 ) data = data[0];
			//console.log("Datastore.put UPDATING");
			if( typeof _key === 'string'){
				data[_key] = _val;
			}else{
				// assume key is an object
				for( var k in _key){
					data[k] = _key[k];
				}
			}
			setTimeout( function(){ _announceChange(_table) }, 10);
			return table.updateById(_id, data);
		}
	}
}


Data._clear = function(_table){
	ReactNativeStore.table( _table )
	.then(function(table){
		table.removeAll();
	})
	.then(function(b){
		//console.log("= Datastore: Cleared table "+ _table );
		//_setDefaults( DefaultData );
	});
}


// Creates a new record if it does not exist
Data.putx = module.exports.putx = function(_table, _obj){
	var table = _findTable(_table);
	if( table ){
		var data = table.where( _obj  ).limit(1).find();
		//console.log("Datastore.putx:", _table, '@1 data', data, data.length);
		//if( data.length == 0 ){
		if( data == undefined ){
			// item does not exist. Add it.
			setTimeout( function(){ _announceChange(_table) }, 10);
			return table.add(_obj);
		}else{
			return -1;
		}
	}
}

*/

