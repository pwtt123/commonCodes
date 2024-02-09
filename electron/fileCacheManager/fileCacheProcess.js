const {ipcRenderer} = require('electron');
var FileCache=require("./fileCache.js");

var zWinID=urlQueryString("winID");


//资料库 fileCache对象 列表,
var fileCache=new FileCache();

// console.log("aa",FileCache.settings)
// console.log("bb",fileCache.settings)



// 和主进程 握手,发送winID
ipcRenderer.send('fileCacheProcessReady', zWinID);



// 获取setupAndLoadDBs
ipcRenderer.on('setupAndLoadDBs', (event,xDataBoxPath,xOptions) => {
  console.log("setupAndLoadDBs");

  var zCallBackEventName="setupAndLoadDBsCallBack"+xOptions["queueNum"];

  fileCache.setupAndLoadDBs(xDataBoxPath,xOptions,function (err) {
    event.sender.send(zCallBackEventName,err);
  })

});


//setupAndLoadDBs
ipcRenderer.on('start', (event,xDataBoxPath,xOptions) => {
  console.log("start");

  var zCallBackEventName="startCallBack"+xOptions["queueNum"];

  fileCache.start(xDataBoxPath,xOptions,function (err) {
    event.sender.send(zCallBackEventName,err);
  })

});


//setupAndLoadDBs
ipcRenderer.on('close', (event) => {
  console.log("close");

  fileCache.close(function (err) {
    event.sender.send("closeCallBack",err);
  })

});


//setupAndLoadDBs
ipcRenderer.on('queryDBData', (event,xFilters,xOptions) => {
  console.log("queryDBData");

  fileCache.queryDBData(xFilters,xOptions,function (err,xDocs) {
    // console.log("xDocs",err,xDocs)
    var zCallBackEventName="queryDBDataCallBack"+xOptions["queueNum"];
    if(xOptions["count"])zCallBackEventName+="-count";


    event.sender.send(zCallBackEventName,err,xDocs);
  })

});






