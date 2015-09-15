var ds 	= require('../');
var xhr = require("xhr");

var _checkReachableInterval = 5 * 1000; // ms
var _serverResponseTime 	= -1;
var _serverIsReachable  	= -1; // -1: unknown/in-progress, 0: not reachable, 1: reachable
var _checkInterval 			= null;
var _subscribers = [];

module.exports.Reachable = function(){
	return (_serverIsReachable === 1);
};

module.exports.subscribe = function(fn_subscriber){
	//console.log('OnReachableStateChanged ADD ', fn_subscriber );
	if( _subscribers.indexOf(fn_subscriber) < 0 ){
		_subscribers.push( fn_subscriber );
	}
}

module.exports.OnReachableStateChanged = function(fn_subscriber){
	console.log('[ WARN ] reach.js OnReachableStateChanged dicontinued. Use subscribe instead');
	/*
	//console.log('OnReachableStateChanged ADD ', fn_subscriber );
	if( _subscribers.indexOf(fn_subscriber) < 0 ){
		_subscribers.push( fn_subscriber );
	}
	*/
}


module.exports.ResponseTime = function(){
	return (_serverIsReachable === 1) ? _serverResponseTime+'ms' : -1;
}

module.exports.enable = function(){
	_checkInterval = setInterval(_checkReachable, _checkReachableInterval);
	_checkReachable();
}
module.exports.disable = function(){
	if( _checkInterval != null ){
		clearInterval( _checkInterval );
	}
}

var _checkReachable = module.exports._CheckReachable = function(){

	var _prevState = _serverIsReachable;

	var addr = ds.opts().net.remotehost +"/version?noop="+ Math.random()*1000;
	//console.log("Reachability endpoint:", addr );
	
	var startTime = Date.now();

	var x = xhr({
		'method':'GET', 
		'uri': addr,
		'timeout': ds.opts().net.timeout
	}, function (err, resp, body){
			//console.log("serverIsReachable response: err, resp, body:", err, resp, body );
			//console.log('_checkReachable resp.statusCode', resp.statusCode);

			var endTime = Date.now();
			//serverResponseTime = (endTime-startTime); //TODO: Format
			_serverResponseTime = (endTime-startTime);
			
			if( err ){
				_serverIsReachable = 0;
			}else{
				_serverIsReachable = 1;
			}

			//console.log('_checkReachable', startTime, endTime, "serverResponseTime:", _serverResponseTime, "_serverIsReachable:", _serverIsReachable, "_prevState:", _prevState, "_subscribers.length", _subscribers.length );

			//if( _prevState != _serverIsReachable ){

				if( _subscribers.length > 0 ){
					_announceChange();
				}
			//}
		}
	);
}

function _announceChange(){
	var state = (_serverIsReachable === 1) ? true:false;
	for( var fn in _subscribers ){
		_subscribers[fn]( state, _serverResponseTime+'ms');
	}
}


