'use strict';

// js@base.io 20150916
// based off an early (0.0.3?) version of https://github.com/thewei/react-native-store
// modified to remove promises, fix a crash occuring the first time the app was run
// and added some additional functions.
// the original had some messed up datastructures - but the Model class was good.

var React = require('react-native');

var { AsyncStorage } = React;

var reactNativeStore = {};
var dbName = "db_store";

var Model = function(tableName, databaseData) {
	this.tableName = tableName;
	this.databaseData = databaseData;
	this._where = null;
	this._limit = 100;
	this._offset = 0;
	return this;
};

// JS
reactNativeStore.setDbName = function(_name){
	dbName = _name;
	console.log('reactNativeStore Using database:', dbName);
}

reactNativeStore.createDataBase = function(cb) {
	AsyncStorage.setItem(dbName, JSON.stringify({}), function(err) {
		cb(err, {});
	});
};


reactNativeStore.saveTable = function(tableName, tableData) {
	AsyncStorage.getItem(dbName, function(err, res) {
		var databaseData = JSON.parse(res);

		databaseData[tableName] = tableData || {
			'totalrows': 0,
			'autoinc': 1,
			'rows': {}
		};

		AsyncStorage.setItem(dbName, JSON.stringify(databaseData), function(err) {
			if( err ) console.log('ERROR saveTable.setItem()', err);
		});
	});
};

// js
/// Loads the database and compares it to the requested table-array
/// missing tables are added, and surplus tables are deleted.
reactNativeStore.prepare = function(scheme, cb){
	var self = this;
	AsyncStorage.getItem(dbName, function(err, res) {
		if( err ) throw err;

		res = JSON.parse(res);
		console.log('res', res);
		if( res == null ){
			console.log('reactNativeStore creating empty database');
			res = {};
		}

		// add
		scheme.forEach( function(sk){
			if( !res[sk] ){
				res[sk] = {'totalrows': 0, 'autoinc': 1, 'rows': {}};
			}
		});

		// rm
		Object.keys(res).forEach( function(rk){
			//console.log('rk', rk);
			if( scheme.indexOf(rk) < 0 ){
				delete res[rk];
			}
		});

		//console.log('res', res);

		// save
		AsyncStorage.setItem(dbName, JSON.stringify(res), function(err){
			cb(err, res );
		});
	});
};

// js
reactNativeStore.modelify = function(tableName, databaseData){
	//console.log('modelify', tableName);
	return new Model(tableName, databaseData);
}


reactNativeStore.getItem = function(key) {
	return new Promise(function(resolve, reject) {
		AsyncStorage.getItem(key, function(err, res) {
			if (err) {
				reject(err);
			} else {
				resolve(JSON.parse(res));
			}
		});
	});
};

// where
Model.prototype.where = function(data) {
	this._where = data || null;
	return this;
};

// limit
Model.prototype.limit = function(data) {
	this._limit = data || 100;
	return this;
};

// offset
Model.prototype.offset = function(data) {
	this._offset = data || 0;
	return this;
};

Model.prototype.init = function(){
	this.where();
	this.limit();
	this.offset();
	return this;
};


Model.prototype.update = function(data) {

	var results = [];
	var rows = this.databaseData["rows"];

	var hasParams = false;
	if (this._where) {
		hasParams = true;
	}

	if (hasParams) {
		for (var row in rows) {

			var isMatch = true;

			for (var key in this._where) {
				if (rows[row][key] != this._where[key]) {
					isMatch = false;
				}
			}

			if (isMatch) {

				results.push(this.databaseData["rows"][row]["_id"]);

				for (var i in data) {
					this.databaseData["rows"][row][i] = data[i];
				}

				reactNativeStore.saveTable(this.tableName, this.databaseData);
			}

		}

		this.init();
		return results;

	} else {
		return false;
	}

};

Model.prototype.updateById = function(id, data) {

	this.where({
		_id: id
	});

	return this.update(data);
};


Model.prototype.remove = function(id) {
	var results = [];
	var rows = this.databaseData["rows"];

	var hasParams = false;
	if (this._where) {
		hasParams = true;
	}

	if (hasParams) {
		for (var row in rows) {

			var isMatch = true;

			for (var key in this._where) {
				if (rows[row][key] != this._where[key]) {
					isMatch = false;
				}
			}

			if (isMatch) {
				results.push(this.databaseData["rows"][row]['_id'])
				delete this.databaseData["rows"][row];
				this.databaseData["totalrows"]--;
				reactNativeStore.saveTable(this.tableName, this.databaseData);
			}

		}

		this.init();
		return results;

	} else {
		return false;
	}

};


// remove all
Model.prototype.removeAll = function() {

	var results = [];
	var rows = this.databaseData["rows"];

	for (var row in rows) {

		results.push(this.databaseData["rows"][row]['_id'])
		delete this.databaseData["rows"][row];
		this.databaseData["totalrows"]--;
		reactNativeStore.saveTable(this.tableName, this.databaseData);
	}

	this.init();
	return results;
};



Model.prototype.removeById = function(id) {

	this.where({
		_id: id
	});

	return this.remove();
};

Model.prototype.add = function(data) {
	var autoinc = this.databaseData.autoinc;
	data._id = autoinc;
	this.databaseData.rows[autoinc] = data;
	this.databaseData.autoinc += 1;
	this.databaseData.totalrows += 1;
	reactNativeStore.saveTable(this.tableName, this.databaseData);

	this.init();
	return autoinc;
}

Model.prototype.get = function(id) {
	this.where({
		_id: id
	});
	
	return this.limit(1).find();
};

Model.prototype.find = function() {
	
	var results = [];
	var rows = this.databaseData["rows"];

	var hasParams = false;
	if (this._where) {
		hasParams = true;
	}

	if (hasParams) {
		for (var row in rows) {
			var isMatch = false;
			for (var key in this._where) {
				if (rows[row][key] == this._where[key]) {
					isMatch = true;
				} else {
					isMatch = false;
					break;
				}
			}

			if (isMatch) {
				results.push(rows[row]);
			}
		}
	} else {
		for (var row in rows) {
			results.push(rows[row]);
		}
	}

	if (typeof(this._limit) === 'number') {
		return results.slice(this._offset, this._limit + this._offset);
	} else {
		return results;
	}

	this.init();
	return results;
};

// JS
Model.prototype.findAll = function() {
	
	var results = [];
	var rows = this.databaseData["rows"];

  
	for (var row in rows) {
		results.push(rows[row]);
	}

	this.init();
	return results;
};

module.exports = reactNativeStore;
