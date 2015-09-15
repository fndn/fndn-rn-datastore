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


	console.log('reset: => ', ds.data.reset("countries") );

	// add
	console.log('add:   => ', ds.data.add("countries", {"name":"xx", "countryCode":"yy"}) );
	console.log('all:   => ', ds.data.all("countries") );
	console.log('–––');

	// add unique
	console.log('addu:   => ', ds.data.addu("countries", {"name":"xx", "countryCode":"yy"}) );
	console.log('all:   => ', ds.data.all("countries") );
	console.log('–––');

	// count
	console.log('count:   => ', ds.data.count("countries") );

	// get where
	console.log('add:   => ', ds.data.add("countries", {"name":"cc", "countryCode":"dk"}) );
	console.log('add:   => ', ds.data.add("countries", {"name":"aa", "countryCode":"dk"}) );
	console.log('add:   => ', ds.data.add("countries", {"name":"bb", "countryCode":"dk"}) );
	console.log('all:   => ', ds.data.all("countries") );
	console.log('where:   => ', ds.data.where("countries", {"countryCode":"dk"}) );

	// orderBy
	var arr = ds.data.where("countries", {"countryCode":"dk"});
	console.log('where:   => ', arr );
	console.log('where, orderBy => ', ds.data.orderBy(arr, "name", 1) );

	//TODO: console.log('removeids, single => ', ds.data.removeids(arr[0]) );
	//TODO: console.log('removeids, many   => ', ds.data.removeids(arr) );
	
	// empty
	console.log('empty: => ', ds.data.empty("countries") );
	console.log('all:   => ', ds.data.all("countries") );
	console.log('–––');

	// reset
	console.log('add:   => ', ds.data.add("countries", {"name":"a3", "countryCode":"bb"}) );
	console.log('all:   => ', ds.data.all("countries") );
	console.log('reset: => ', ds.data.reset("countries") );
	console.log('all:   => ', ds.data.all("countries") );
	console.log('add:   => ', ds.data.add("countries", {"name":"a4", "countryCode":"bb"}) );
	console.log('all:   => ', ds.data.all("countries") );
	console.log('–––');
	
	// put
	console.log('add:   => ', ds.data.add("countries", {"name":"aa", "countryCode":"bb"}) );
	console.log('all:   => ', ds.data.all("countries") );
	console.log('put:   => ', ds.data.put("countries", {"name":"aa"}, {"countryCode":"b-b"}) );
	console.log('all:   => ', ds.data.all("countries") );
	console.log('–––');

	console.log('put:   => ', ds.data.put("countries", {"name":"aa"}, {"test":"test"}) );
	console.log('all:   => ', ds.data.all("countries") );
	console.log('–––');

	// del
	console.log('del:   => ', ds.data.del("countries", {"name":"aa"}) );
	console.log('all:   => ', ds.data.all("countries") );
	console.log('–––');

	// del all
	console.log('add:   => ', ds.data.add("countries", {"name":"a1", "countryCode":"cca1"}) );
	console.log('add:   => ', ds.data.add("countries", {"name":"a1", "countryCode":"cca2"}) );
	console.log('add:   => ', ds.data.add("countries", {"name":"a3", "countryCode":"cca3"}) );
	console.log('all:   => ', ds.data.all("countries") );
	console.log('delall:=> ', ds.data.delall("countries", {"name":"a1"}) );
	console.log('all:   => ', ds.data.all("countries") );
	console.log('–––');

	// one, last
	console.log('add:   => ', ds.data.add("countries", {"name":"b1", "countryCode":"ccb1"}) );
	console.log('add:   => ', ds.data.add("countries", {"name":"b1", "countryCode":"ccb2"}) );
	console.log('add:   => ', ds.data.add("countries", {"name":"b3", "countryCode":"ccb3"}) );
	console.log('all:   => ', ds.data.all("countries") );
	console.log('one:   => ', ds.data.one("countries", {"countryCode":"ccb2"}) );
	console.log('last:   => ', ds.data.last("countries") );
	console.log('–––');
}