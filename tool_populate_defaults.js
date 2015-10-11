
var ds = require('./');



module.exports = {
	init_countries: function(){ _send( 'countries', _data_countries ) },
}

function _send(type, items){
	console.log('Sending ', type, items );

	// compute hash
	items = items.map( function(el){
		var h = ds.hash( el );
		el.hash = h;
		return el;
	});

	ds.xhr({
		method:'POST',
		uri: ds.opts().net.remotehost +'/'+ type +'/diff',
		json: {list:items},
		'headers': {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'X-Auth-Token': ds.opts().net.auth_token
		},

	},
	function (err, resp, body){
		if( resp.statusCode == 200 ){
			console.log('body:', body);
		}
	});
}


/// Data ///////////////////////////////////////////////////////////

var _data_countries = [
	{"name": "Albania", "countryCode": "ALB"},
	{"name": "Andorra", "countryCode": "AND"},
	{"name": "Armenia", "countryCode": "ARM"},
	{"name": "Austria", "countryCode": "AUT"},
	{"name": "Azerbaijan", "countryCode": "AZE"},
	{"name": "Belarus", "countryCode": "BLR"},
	{"name": "Belgium", "countryCode": "BEL"},
	{"name": "Bosnia and Herzegovina", "countryCode": "BIH"},
	{"name": "Bulgaria", "countryCode": "BGR"},
	{"name": "Croatia", "countryCode": "HRV"},
	{"name": "Cyprus", "countryCode": "CYP"},
	{"name": "Czech Republic", "countryCode": "CZE"},
	{"name": "Denmark", "countryCode": "DNK"},
	{"name": "Estonia", "countryCode": "EST"},
	{"name": "Finland", "countryCode": "FIN"},
	{"name": "France", "countryCode": "FRA"},
	{"name": "Georgia", "countryCode": "GEO"},
	{"name": "Germany", "countryCode": "DEU"},
	{"name": "Greece", "countryCode": "GRC"},
	{"name": "Hungary", "countryCode": "HUN"},
	{"name": "Iceland", "countryCode": "ISL"},
	{"name": "Ireland", "countryCode": "IRL"},
	{"name": "Israel", "countryCode": "ISR"},
	{"name": "Italy", "countryCode": "ITA"},
	{"name": "Kazakhstan", "countryCode": "KAZ"},
	{"name": "Kyrgyzstan", "countryCode": "KGZ"},
	{"name": "Latvia", "countryCode": "LVA"},
	{"name": "Lithuania", "countryCode": "LTU"},
	{"name": "Luxembourg", "countryCode": "LUX"},
	{"name": "Malta", "countryCode": "MLT"},
	{"name": "Monaco", "countryCode": "MCO"},
	{"name": "Montenegro", "countryCode": "MNE"},
	{"name": "Netherlands", "countryCode": "NLD"},
	{"name": "Norway", "countryCode": "NOR"},
	{"name": "Poland", "countryCode": "POL"},
	{"name": "Portugal", "countryCode": "PRT"},
	{"name": "Republic of Moldova", "countryCode": "MDA"},
	{"name": "Romania", "countryCode": "ROU"},
	{"name": "Russian Federation", "countryCode": "RUS"},
	{"name": "San Marino", "countryCode": "SMR"},
	{"name": "Serbia", "countryCode": "SRB"},
	{"name": "Slovakia", "countryCode": "SVK"},
	{"name": "Slovenia", "countryCode": "SVN"},
	{"name": "Spain", "countryCode": "ESP"},
	{"name": "Sweden", "countryCode": "SWE"},
	{"name": "Switzerland", "countryCode": "CHE"},
	{"name": "Tajikistan", "countryCode": "TJK"},
	{"name": "The former Yugoslav Republic of Macedonia", "countryCode": "MKD"},
	{"name": "Turkey", "countryCode": "TUR"},
	{"name": "Turkmenistan", "countryCode": "TKM"},
	{"name": "Ukraine", "countryCode": "UKR"},
	{"name": "United Kingdom", "countryCode": "GBR"},
	{"name": "Uzbekistan", "countryCode": "UZB"}
];