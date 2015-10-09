
// data init tool

var xhr = require("xhr");

var config = {
	server: 	'http://127.0.0.1:8090',
	auth_token: 'fr9a7as792jjd0293hddxonxo0x1309210cpdshcpihvq0823t373e4463',
}


var data = [
	{table:'incomeTypes', items: [
		{name: 'Low income'},
		{name: 'High income'}
	]},

	{table: 'storeTypes', items: [
		{name: 'Supermarket'},
		{name: 'Pharmacy'},
		{name: 'Convenience store / Corner shop'},
		{name: 'Health Food store'},
		{name: 'Department store'},
		{name: 'Mini-market'},
		{name: 'Other'}
	]},

	{table: 'brands', items: [
		{name: "Nestle"},
		{name: "Mead Johnson"},
		{name: "Numico"},
		{name: "Kidfresh"},
		{name: "Cow & Gate"},
		{name: "Farley's"},
		{name: "Cereo "},
		{name: "Earth's Best"},
		{name: "Plum Organics"},
		{name: "Happyfamily"},
		{name: "Ella's Kitchen"},
		{name: "Sprout"},
		{name: "Gerber"},
		{name: "Yummy spoonfuls"},
		{name: "Hipp"},
		{name: "Semper"},
		{name: "Arla"},
		{name: "Baby love"},
		{name: "Similac"},
		{name: "Heinz"},
		{name: "Abbott"}
	]},

	{table: 'countries', items: [
		{name: 'Denmark', 		countryCode:'DK'},
		{name: 'Germany', 		countryCode:'DE'},
		{name: 'Greece', 		countryCode:'GR'},
		{name: 'Italy', 		countryCode:'IT'},
		{name: 'Moldova', 		countryCode:'MD'},
		{name: 'Poland', 		countryCode:'PL'},
		{name: 'Portugal', 		countryCode:'PT'},
		{name: 'Russia', 		countryCode:'RU'},
		{name: 'Spain', 		countryCode:'ES'},
		{name: 'Tajikistan', 	countryCode:'TJ'},
		{name: 'United Kingdom',countryCode:'UK'},
		{name: 'Uzbekistan', 	countryCode:'UZ'}
	]},

	{table: 'ageGroups', items: [
		{name: '≤ 3'},
		{name: '4'},
		{name: '5'},
		{name: '6'},
		{name: '7'},
		{name: '8'},
		{name: '9'},
		{name: '10'},
		{name: '11'},
		{name: '12'},
		{name: '13'},
		{name: '14'},
		{name: '15'},
		{name: '16'},
		{name: '17'},
		{name: '18'},
		{name: '19'},
		{name: '20'},
		{name: '21'},
		{name: '22'},
		{name: '23'}
	]}
];

var	_index = 0;
var	_step  = 0;

function _next(){
	_step ++;
	if( _step >= data[_index].items.length ){
		_list( data[_index] );
		_step = 0;
		_index ++;
		if( _index >= data.length ){
			_index = 0;
			_done();
		}else{
			_send( data[_index] );
		}
	}else{
		_send( data[_index] );
	}
}

function _done(){
	console.log('Done');
}

function _list(type){
	xhr({
		method:'GET',
		uri: config.server +'/'+ type.table,
		'headers': {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'X-Auth-Token': config.auth_token
		}
	},
	function (err, resp, body){
		if( resp.statusCode == 200 ){
			console.log('list body:', body);
		}
	});
}

function _send(type){
	console.log('', type.table, type.items[_step] );
	//_next();

	xhr({
		method:'PUT',
		uri: config.server +'/'+ type.table,
		json: type.items[_step],
		'headers': {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'X-Auth-Token': config.auth_token
		},

	},
	function (err, resp, body){
		if( resp.statusCode == 200 ){
			//console.log('body:', body);
			_next();
		}
	});
}



_send( data[_index] );