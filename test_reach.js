var ds = require('./');

module.exports = function(){

	console.log('--- Running Reach tests ---');

	ds.reach.OnReachableStateChanged( function(state, responsetime){
		console.log("OnReachableStateChanged", state, responsetime);
	});

	ds.reach.subscribe( function(state, responsetime){
		console.log("ReachableStateChanged", state, responsetime);
	});

	ds.reach.enable();

}
