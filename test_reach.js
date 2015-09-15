//var Datastore = require('./index.ios.js');
var Datastore = require('./');

module.exports = function(){

	console.log('--- Running Reach tests ---');

	Datastore.reach.OnReachableStateChanged( function(state, responsetime){
		console.log("OnReachableStateChanged", state, responsetime);
	});

	Datastore.reach.subscribe( function(state, responsetime){
		console.log("ReachableStateChanged", state, responsetime);
	});

	Datastore.reach.enable();

}
