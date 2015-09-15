//
//  fndn_rn_datastore.m
//  fndn-rn-datastore
//
//  Created by Jørgen Skogmo on 10/09/15.
//  Copyright (c) 2015 Jørgen Skogmo. All rights reserved.
//

#import "fndn_rn_datastore.h"

@implementation fndn_rn_datastore

/// Event emitter bridge
@synthesize bridge = _bridge;


/// Make this module available to React: require('NativeModules').RNFile;
RCT_EXPORT_MODULE();


- (instancetype)init {
	NSLog(@"fndn-rn-datastore native code init");
	if((self = [super init])) {
		/// Setup the webserver, but dont start it
		[GCDWebServer setLogLevel:2];
		_webServer = [[GCDWebServer alloc] init];
		NSString * documentsDirectory = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) objectAtIndex:0];
		[_webServer addGETHandlerForBasePath:@"/" directoryPath:documentsDirectory indexFilename:nil cacheAge:0 allowRangeRequests:NO];
	}
	return self;
}


#pragma mark - webserver

RCT_EXPORT_METHOD(startServer:(NSDictionary *) obj) {
	
	NSLog(@"FNDN-RN-DATASTORE: startServer()");
	
	NSUInteger port = [obj[@"port"] intValue];
	NSString *bonjourName = obj[@"bonjourName"];
	
	if( bonjourName ){
		[_webServer startWithPort:port bonjourName:bonjourName];
		NSLog(@"Started GCDWebServer at %@ with bonjourName %@, port: %lu", _webServer.serverURL, bonjourName, (unsigned long)port);
	}else{
		[_webServer startWithPort:port bonjourName:nil];
		NSLog(@"Started GCDWebServer at %@", _webServer.serverURL);
	}
}

#pragma mark - Download


- (void)didFinishLoadingAllForManager:(DownloadManager *)downloadManager {
	NSLog(@"downloadDidFinishLoadingAll");
	[self.bridge.eventDispatcher sendAppEventWithName:@"OnDownloadDone" body:@{@"done":@1}];
}

- (void)downloadManager:(DownloadManager *)downloadManager downloadDidFinishLoading:(Download *)download {
	NSLog(@"downloadDidFinishLoading");
	NSString * filename = [download.filename lastPathComponent];
	[self.bridge.eventDispatcher sendAppEventWithName:@"OnDownloadComplete" body:@{@"filename": filename}];
}

- (void)downloadManager:(DownloadManager *)downloadManager downloadDidFail:(Download *)download {
	//NSLog(@"1 downloadDidFail: %@", download);
	NSLog(@"ERROR downloadDidFail, download.url: %@", download.url);
	
	[self.bridge.eventDispatcher sendAppEventWithName:@"OnDownloadFail" body:@{@"url": [download.url absoluteString]}];
}

- (void)downloadManager:(DownloadManager *)downloadManager downloadDidReceiveData:(Download *)download {
	
	float cur = (float)download.progressContentLength;
	float tot = (float)download.expectedContentLength;
	NSNumber *pct = [[NSNumber alloc] initWithFloat:(cur/tot)];
	//NSLog(@"downloadDidReceiveData %f / %f => %@", cur, tot, pct );
	NSString* formattedPct = [NSString stringWithFormat:@"%.03f", [pct floatValue]];
	
	NSString * filename = [download.filename lastPathComponent];
	
	[self.bridge.eventDispatcher sendAppEventWithName:@"OnDownloadProgress" body:@{@"filename":filename, @"pct":formattedPct}];
}

RCT_EXPORT_METHOD(download:(NSDictionary *) obj){
	
	NSArray  * urls  = obj[@"urls"];
	NSString * fldr  = obj[@"directory"];
	NSNumber * force = obj[@"force"];
	BOOL _force = NO;
	//NSLog(@"force: %@", force );
	
	/// By default, we check if the file is already in the folder - and only (re)downloads it if its not.
	/// Supply force:true to skip this check
	if( [force isEqualToNumber:@1] ){
		_force = YES;
	}
	
	NSString * documentsDirectory = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) objectAtIndex:0];
	NSString * downloadFolder = [documentsDirectory stringByAppendingPathComponent:fldr];
	NSArray  * directoryContent;
	
	if( !_force ){
		// Get list of files in folder:
		directoryContent = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:downloadFolder error:nil];
	}
	
	self.downloadManager = [[DownloadManager alloc] initWithDelegate:self];
	
	NSString * name;
	NSString * dest;
	NSURL    * url;
	for (NSString *urlString in urls) {
		if( _force ){
			name = [urlString lastPathComponent];
			dest = [downloadFolder stringByAppendingPathComponent:name];
			url  = [NSURL URLWithString:urlString];
			NSLog(@"Forcing (re)download of %@", [url absoluteString]);
			[self.downloadManager addDownloadWithFilename:dest URL:url];
		}else{
			name = [urlString lastPathComponent];
			// Check if the file is present in the destination directory
			if( NSNotFound == [directoryContent indexOfObject:name]){
				dest = [downloadFolder stringByAppendingPathComponent:name];
				url  = [NSURL URLWithString:urlString];
				[self.downloadManager addDownloadWithFilename:dest URL:url];
			}else{
				NSLog(@"The file '%@' is already downloaded", name);
			}
		}
	}
}



#pragma mark - Rename


RCT_EXPORT_METHOD(mv:(NSDictionary *) obj callback:(RCTResponseSenderBlock)callback){
	NSString *curName = obj[@"curname"];
	NSString *newName = obj[@"newname"];
	
	NSString * documentsDirectory = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) objectAtIndex:0];
	NSString * curpath = [documentsDirectory stringByAppendingPathComponent:curName];
	NSString * newpath = [documentsDirectory stringByAppendingPathComponent:newName];
	NSLog(@"FNDN-RN-DATASTORE: rename() called with curName:%@, newName:%@, newpath:%@", curName, newName, newpath);
	
	NSError * err = nil;
	NSDictionary *res= [NSDictionary alloc];

	NSFileManager *fileManager = [NSFileManager defaultManager];
	if( [fileManager fileExistsAtPath:curpath] ){
		BOOL result = [fileManager moveItemAtPath:curpath toPath:newpath error:&err];
		if(!result){
			NSLog(@"Error: %@", err);
			res = [res initWithObjectsAndKeys:err, @"error", nil];
			callback(@[@true, res]);
		}else{
			res = [res initWithObjectsAndKeys:newpath, @"newpath", nil];
			callback(@[[NSNull null], res]);
		}
	}else{
		NSLog(@"Error: Source file not found");
		res = [res initWithObjectsAndKeys:@"Source file not found", @"error", nil];
		callback(@[@true, res]);
	}
}


#pragma mark - List directory

/// List a directory (relative to <Sandbox>/Documents)
/// call like `listdir({})` to list all items in <Sandbox>/Documents/; Filtered by the default extensions
/// call like `listdir({dir:'downloads'})` to list all items in <Sandbox>/Documents/downloads; Filtered by the default extensions
/// call like `listdir({dir:'downloads', exts:['png']})` to list all png files in <Sandbox>/Documents/downloads
/// call like `listdir({dir:'downloads', exts:['png','jpg']})` to list all png AND jpg files in <Sandbox>/Documents/downloads
/// call like `listdir({exts:['all']})` to list ALL files in <Sandbox>/Documents/ (No filtering applied)
// todo/enhancement: exts:['dirs'] => directories only
// todo/enhancement: exts:['files'] => files only
// todo/enhancement: exts: 'nodot' => exclude files starting with "."

RCT_EXPORT_METHOD(list:(NSDictionary *) obj callback:(RCTResponseSenderBlock)callback){
	NSString * subdir     = obj[@"dir"];
	NSArray  * extensions = obj[@"exts"];
	BOOL _filter = YES;
	
	if( [extensions count] == 0 ){
		extensions = [NSArray arrayWithObjects:@"mp4", @"mov", @"m4v", @"jpg", @"png", nil];
	}else{
		
		if( [[extensions objectAtIndex:0] isEqualToString:@"all"] ){
			_filter = NO;
		}
	}
	
	NSString * documentsDirectory = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) objectAtIndex:0];
	NSString * directory = [documentsDirectory stringByAppendingPathComponent:subdir];
	NSArray  * directoryContent = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:directory error:nil];
	NSArray  * filtered = [directoryContent filteredArrayUsingPredicate:[NSPredicate predicateWithFormat:@"pathExtension IN %@", extensions]];
	if( !_filter ){
		filtered = directoryContent;
	}

	if( [subdir isEqualToString:@""] ){
		subdir = @"/";
	}
	
	NSDictionary * res = [NSDictionary alloc];
	if( [filtered count] > 0 ){
		res = [res initWithObjectsAndKeys: subdir, @"directory", filtered, @"list", nil];
	}else{
		res = [res initWithObjectsAndKeys: subdir, @"directory", @[], @"list", nil];
	}
	
	/// Respond
	callback(@[[NSNull null], res]);
}


#pragma mark - Delete

#pragma mark - Copy

// dev
RCT_EXPORT_METHOD(copy:(NSDictionary *) obj callback:(RCTResponseSenderBlock)callback){
	NSString *assetPath = obj[@"path"];
	NSString *assetName = obj[@"name"];
	NSLog(@"FNDN-RN-DATASTORE: copy() called with assetPath:%@, assetName:%@", assetPath, assetName);
	
	//NSData *data = UIImagePNGRepresentation(assetPath);
	//[data writeToFile:storePath atomically:YES];
	
	NSString * documentsDirectory = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) objectAtIndex:0];
	NSString * storePath = [documentsDirectory stringByAppendingPathComponent:assetName];
	
	/*
	 NSError * error = nil;
	 [[NSFileManager defaultManager] copyItemAtURL:fileURL
	 toURL:[NSURL fileURLWithPath:storePath]
	 error:&error];
	 
	 if( error ) NSLog(@"%@", error);
	 */
	
	
	/// Delete
	//BOOL success = [FileManager fileExistsAtPath:storePath];
	//if(success) [FileManager removeItemAtPath:path error:&error];
	
	/// Respond
	NSDictionary *res=[[NSDictionary alloc] initWithObjectsAndKeys: storePath, @"path", nil];
	callback(@[[NSNull null], res]);
}


#pragma mark - Util

RCT_EXPORT_METHOD(printDocumentsPath){
	NSLog(@"documentsDirectory: %@", [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) objectAtIndex:0]);
}

#pragma mark - Upload

#pragma mark NSURLSession Delegate Methods

/*
 - (void)URLSession:(NSURLSession *)session dataTask:(NSURLSessionDataTask *)dataTask didReceiveData:(NSData *)data {
	NSString * str = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
	NSLog(@"Received String %@",str);
 }
 
 - (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didSendBodyData:(int64_t)bytesSent totalBytesSent:(int64_t)totalBytesSent totalBytesExpectedToSend:(int64_t)totalBytesExpectedToSend {
	NSLog(@"didSendBodyData: %lld, totalBytesSent: %lld, totalBytesExpectedToSend: %lld", bytesSent, totalBytesSent, totalBytesExpectedToSend);
 }
 
 - (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error {
	if (error != NULL) NSLog(@"Error: %@",[error localizedDescription]);
 }
 */

RCT_EXPORT_METHOD(___upload:(NSDictionary *) obj){
	
	NSString * file  = obj[@"file"];
	NSURL * documentsUrl = [[[NSFileManager defaultManager] URLsForDirectory: NSDocumentDirectory inDomains: NSUserDomainMask] firstObject];
	NSURL * localUrl = [documentsUrl URLByAppendingPathComponent:file];
	
	NSLog(@"localUrl: %@", localUrl );
}

#pragma mark - FileUpload

/// based on booxood's https://github.com/booxood/react-native-file-upload

RCT_EXPORT_METHOD(upload:(NSDictionary *)obj callback:(RCTResponseSenderBlock)callback)
{
	NSString *uploadUrl = obj[@"uploadUrl"];
	NSDictionary *fields = obj[@"fields"];
	NSArray *files = obj[@"files"];
	NSString *method = @"PUT";
	
	NSURL *url = [NSURL URLWithString:uploadUrl];
	NSMutableURLRequest *req = [NSMutableURLRequest requestWithURL:url];
	[req setHTTPMethod:method];
	
	// set headers
	NSString *formBoundaryString = [self generateBoundaryString];
	NSString *contentType = [NSString stringWithFormat:@"multipart/form-data; boundary=%@", formBoundaryString];
	[req setValue:contentType forHTTPHeaderField:@"Content-Type"];
	[req setValue:@"application/json" forHTTPHeaderField:@"Accept"];
	
	NSData *formBoundaryData = [[NSString stringWithFormat:@"--%@\r\n", formBoundaryString] dataUsingEncoding:NSUTF8StringEncoding];
	NSMutableData* reqBody = [NSMutableData data];
	
	// add fields
	for (NSString *key in fields) {
		id val = [fields objectForKey:key];
		if ([val respondsToSelector:@selector(stringValue)]) {
			val = [val stringValue];
		}
		if (![val isKindOfClass:[NSString class]]) {
			continue;
		}
		
		[reqBody appendData:formBoundaryData];
		[reqBody appendData:[[NSString stringWithFormat:@"Content-Disposition: form-data; name=\"%@\"\r\n\r\n", key] dataUsingEncoding:NSUTF8StringEncoding]];
		[reqBody appendData:[val dataUsingEncoding:NSUTF8StringEncoding]];
		[reqBody appendData:[@"\r\n" dataUsingEncoding:NSUTF8StringEncoding]];
	}
	
	// add files
	NSFileManager *fileManager = [NSFileManager defaultManager];
	NSString * documentsDirectory = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) objectAtIndex:0];
	
	for (NSDictionary *file in files) {
		NSString *filename = file[@"filename"];
		NSString *filepath = file[@"filepath"];
		NSString *filetype = file[@"filetype"];
		
		
		NSData *fileData = nil;
		NSString * localFile = [documentsDirectory stringByAppendingPathComponent:filepath];
		//NSLog(@"exists: %hhd, filepath: %@, localFile: %@", [fileManager fileExistsAtPath:localFile], filepath, localFile);

		if( [fileManager fileExistsAtPath:localFile] ){
			fileData = [NSData dataWithContentsOfFile:localFile];
		}else{
			//callback(TRUE, [NSString stringWithFormat:@"file not found: %@ (%@)", filepath, localFile] );

			NSDictionary *res=[[NSDictionary alloc] initWithObjectsAndKeys:[NSString stringWithFormat:@"file not found: %@", filepath], @"error",nil];
	
			callback(@[@TRUE, res]);

			return;
		}
		//NSLog(@"++ post fs exists check");
		
		/*
		 NSLog(@"filepath: %@", filepath);
		 if ([filepath hasPrefix:@"assets-library:"]) {
			NSURL *assetUrl = [[NSURL alloc] initWithString:filepath];
			ALAssetsLibrary *library = [[ALAssetsLibrary alloc] init];
		 
			__block BOOL isFinished = NO;
			__block NSData * tempData = nil;
			[library assetForURL:assetUrl resultBlock:^(ALAsset *asset) {
		 ALAssetRepresentation *rep = [asset defaultRepresentation];
		 
		 CGImageRef fullScreenImageRef = [rep fullScreenImage];
		 UIImage *image = [UIImage imageWithCGImage:fullScreenImageRef];
		 tempData = UIImagePNGRepresentation(image);
		 isFinished = YES;
			} failureBlock:^(NSError *error) {
		 NSLog(@"ALAssetsLibrary assetForURL error:%@", error);
		 isFinished = YES;
			}];
			while (!isFinished) {
		 [[NSRunLoop currentRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.01f]];
			}
			fileData = tempData;
		 } else if ([filepath hasPrefix:@"data:"] || [filepath hasPrefix:@"file:"]) {
			NSURL *fileUrl = [[NSURL alloc] initWithString:filepath];
			fileData = [NSData dataWithContentsOfURL: fileUrl];
		 } else {
			fileData = [NSData dataWithContentsOfFile:filepath];
		 }
		 */
		
		[reqBody appendData:formBoundaryData];
		[reqBody appendData:[[NSString stringWithFormat:@"Content-Disposition: form-data; name=\"%@\"; filename=\"%@\"\r\n", filename, filename] dataUsingEncoding:NSUTF8StringEncoding]];
		
		if (filetype) {
			[reqBody appendData:[[NSString stringWithFormat:@"Content-Type: %@\r\n", filetype] dataUsingEncoding:NSUTF8StringEncoding]];
		} else {
			[reqBody appendData:[[NSString stringWithFormat:@"Content-Type: %@\r\n", [self mimeTypeForPath:filepath]] dataUsingEncoding:NSUTF8StringEncoding]];
		}
		
		[reqBody appendData:[[NSString stringWithFormat:@"Content-Length: %ld\r\n\r\n", (long)[fileData length]] dataUsingEncoding:NSUTF8StringEncoding]];
		[reqBody appendData:fileData];
		[reqBody appendData:[@"\r\n" dataUsingEncoding:NSUTF8StringEncoding]];
	}
	
	// add end boundary
	NSData* end = [[NSString stringWithFormat:@"--%@--\r\n", formBoundaryString] dataUsingEncoding:NSUTF8StringEncoding];
	[reqBody appendData:end];
	
	// send request
	[req setHTTPBody:reqBody];
	NSHTTPURLResponse *response = nil;
	NSData *returnData = [NSURLConnection sendSynchronousRequest:req returningResponse:&response error:nil];
	NSInteger statusCode = [response statusCode];
	NSString *returnString = [[NSString alloc] initWithData:returnData encoding:NSUTF8StringEncoding];
	
	NSDictionary *res=[[NSDictionary alloc] initWithObjectsAndKeys:[NSNumber numberWithInteger:statusCode],@"status",returnString,@"data",nil];
	
	callback(@[[NSNull null], res]);
}

- (NSString *)generateBoundaryString
{
	NSString *uuid = [[NSUUID UUID] UUIDString];
	return [NSString stringWithFormat:@"----%@", uuid];
}

- (NSString *)mimeTypeForPath:(NSString *)filepath
{
	NSString *fileExtension = [filepath pathExtension];
	NSString *UTI = (__bridge_transfer NSString *)UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, (__bridge CFStringRef)fileExtension, NULL);
	NSString *contentType = (__bridge_transfer NSString *)UTTypeCopyPreferredTagWithClass((__bridge CFStringRef)UTI, kUTTagClassMIMEType);
	
	NSLog(@"ext from fn:%@ => %@", filepath, contentType);

	if (contentType) {
		return contentType;
	}
	return @"application/octet-stream";
}

@end


