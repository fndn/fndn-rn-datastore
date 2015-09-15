//
//  fndn_rn_datastore.h
//  fndn-rn-datastore
//
//  Created by Jørgen Skogmo on 10/09/15.
//  Copyright (c) 2015 Jørgen Skogmo. All rights reserved.
//


#import <Foundation/Foundation.h>
#import <MobileCoreServices/MobileCoreServices.h>

/// ReactNative
#import "RCTBridgeModule.h"
#import "RCTLog.h"
#import "RCTBridge.h"
#import "RCTEventDispatcher.h"

/// GCDWebServer: https://github.com/swisspol/GCDWebServer
#import "GCDWebServer.h"
#import "GCDWebServerDataResponse.h"

/// Download-Manager: https://github.com/robertmryan/download-manager
#import "DownloadManager.h"

@interface fndn_rn_datastore : NSObject <RCTBridgeModule, DownloadManagerDelegate>{
	GCDWebServer* _webServer;
}
@property (strong, nonatomic) DownloadManager *downloadManager;

@end
