var ds = require('./');

module.exports = function(){

	console.log('--- Running Local Data tests ---');

	/*
	ds.data.OnChange('countries', function( change ){
		console.log("ds.OnChange", change);
	});
	*/

	ds.data.init( function(){
		console.log("ds.data.init cb");
		test_localstore();
	});


}

function test_localstore(){
	console.log('test_localstore');

	console.log('add:   => ', ds.data.add("countries", {"name":"xx", "countryCode":"yy"}) );
	console.log('all:   => ', ds.data.all("countries") );
	console.log('–––');

	console.log('empty: => ', ds.data.empty("countries") );
	console.log('all:   => ', ds.data.all("countries") );
	console.log('–––');

	console.log('add:   => ', ds.data.add("countries", {"name":"aa", "countryCode":"bb"}) );
	console.log('all:   => ', ds.data.all("countries") );
	console.log('–––');

	console.log('put:   => ', ds.data.put("countries", {"name":"aa"}, {"countryCode":"b-b"}) );
	console.log('all:   => ', ds.data.all("countries") );
	console.log('–––');

	console.log('put:   => ', ds.data.put("countries", {"name":"aa"}, {"test":"test"}) );
	console.log('all:   => ', ds.data.all("countries") );
	console.log('–––');

	console.log('del:   => ', ds.data.del("countries", {"name":"aa"}) );
	console.log('all:   => ', ds.data.all("countries") );
	console.log('–––');

	console.log('add:   => ', ds.data.add("countries", {"name":"a1", "countryCode":"cca1"}) );
	console.log('add:   => ', ds.data.add("countries", {"name":"a1", "countryCode":"cca2"}) );
	console.log('add:   => ', ds.data.add("countries", {"name":"a3", "countryCode":"cca3"}) );
	console.log('all:   => ', ds.data.all("countries") );
	console.log('delall:=> ', ds.data.delall("countries", {"name":"a1"}) );
	console.log('all:   => ', ds.data.all("countries") );
	console.log('–––');

	console.log('add:   => ', ds.data.add("countries", {"name":"b1", "countryCode":"ccb1"}) );
	console.log('add:   => ', ds.data.add("countries", {"name":"b1", "countryCode":"ccb2"}) );
	console.log('add:   => ', ds.data.add("countries", {"name":"b3", "countryCode":"ccb3"}) );
	console.log('all:   => ', ds.data.all("countries") );
	console.log('one:   => ', ds.data.one("countries", {"countryCode":"ccb2"}) );
	console.log('last:   => ', ds.data.last("countries") );
	console.log('–––');

	//Datastore.ds.putx("countries", {"name":"aa", "countryCode":"cc"});

	//console.log('one countries (name=aa) => ', Datastore.one("countries", ) );
}