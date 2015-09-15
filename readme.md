## fndn-rn-datastore

An offline-first synch'ing Datastore solution for React Native.

*Note: Work-in-progress, please check back later*

* Persistent on-device store wrapping [react-native-store]()  
* Global in-memory store  
* Sync on-device store with remote (using [fndn/mirror]())
* Batch upload of images (with server-side resizing using [sharp]())
* Batch download with cache-test using [DownloadManager]()
* Misc iOS Filesystem utils (rename, copy, delete)
* and a lot more...

## Installation

Install using npm with `npm install --save fndn/fndn-rn-datastore`

You then need to add the Objective C part to your XCode project. Drag
`fndn-rn-datastore.xcodeproj` from the `node_modules/fndn-rn-datastore` folder into your XCode projec. Click on the your project in XCode, goto `Build Phases` then `Link Binary With Libraries` and add `fndn-rn-datastore.a`, `libz.dylib` and `libxml2.dylib`.

## Usage

See index.ios.js
