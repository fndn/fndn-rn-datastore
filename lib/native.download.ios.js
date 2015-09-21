
var React 	= require('react-native');
var ds 		= require('../');

/// Proxy the RNFile::DownloadManger
/// Provides a sequenced batch-download with the following callbacks:
/// 
/// OnDownloadDone 		: Finnished
/// OnDownloadComplete 	: Completed one file
/// OnDownloadFail 		: One file errored
/// OnDownloadProgress  : Received data for one file

// NTH: enhancement: provide the info we need as arguments (define protocol)
module.exports = function( opts, __OnDownloadDone, __OnDownloadComplete, __OnDownloadFail, __OnDownloadProgress){

	if( _DownloaderWorking ){
		console.log('Downloader is already working... please try later!');
		//FIXME: Add files to existing queue
		//FIXME: Make sure one failed DL doesnt block the _OnDownloadDone clear
		return false;
	}


	_OnDownloadDone 		= __OnDownloadDone;
	_OnDownloadComplete 	= __OnDownloadComplete;
	_OnDownloadFail			= __OnDownloadFail;
	_OnDownloadProgress 	= __OnDownloadProgress;
	_DownloaderOptions 		= opts;
	_DownloaderError 		= false;
	_DownloaderWorking 		= true;

	ds.native.download( _DownloaderOptions );
	return true;
}

/// Store opts (so we can get to them later)
var _DownloaderOptions 		= {};
var _DownloaderError 		= false;
var _DownloaderWorking 		= false;

/// Event Callbacks
var _OnDownloadDone = null, _OnDownloadComplete = null, _OnDownloadFail = null, _OnDownloadProgress = null;

/// Connect EventListeners to the OnDownload* events.
/// These will be called from the Native code via RCTEventDispatcher::sendAppEventWithName
var _OnDownloadDoneListener = React.NativeAppEventEmitter.addListener('OnDownloadDone', function(message){
	if( _OnDownloadDone ) _OnDownloadDone(_DownloaderError, _DownloaderOptions);

	ds.native.list({dir:_DownloaderOptions.directory}, function(err, res){
		console.log("OnDownloadDone listing "+ res.directory +" => ", res.list);
	});

	// Remove EventListeners (we're done)
	_OnDownloadDone 	= null;
	_OnDownloadComplete = null;
	_OnDownloadFail 	= null;
	_OnDownloadProgress = null;
	_DownloaderOptions  = {};
	_DownloaderError 	= false;
	_DownloaderWorking 	= false;
});

var _OnDownloadCompleteListener = React.NativeAppEventEmitter.addListener('OnDownloadComplete', function(message){
	if( _OnDownloadComplete ) _OnDownloadComplete(message);
});

var _OnDownloadFailListener 	= React.NativeAppEventEmitter.addListener('OnDownloadFail', function(message){
	_DownloaderError = true;
	if( _OnDownloadFail ) _OnDownloadFail(message);
});

var _OnDownloadProgressListener = React.NativeAppEventEmitter.addListener('OnDownloadProgress', function(message){
	if( _OnDownloadProgress ) _OnDownloadProgress(message);
});
