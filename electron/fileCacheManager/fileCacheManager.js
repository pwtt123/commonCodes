const {ipcMain, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');
var FileCache = require("./fileCache.js");
var _ = require("underscore");
var chance = require("chance");
var Thenjs = require("Thenjs");
/*
 fileCache连接池 ， 管理 不同资料库 的fileCache实例, 当无人调用时 关闭对应的fileCache，当多人调用同一fileCache时，使用同一实例

 */




var FileCacheManager = function () {


  // 缓存进程 ready 后，触发事件，并保存此进程的事件，
  ipcMain.on('fileCacheProcessReady', (event, xWinID) => {
    try{

      //查询
    var zThisDataBox = _.findWhere(zThis.data.dataBoxFileCacheList, {winID: xWinID});

      zThisDataBox["processSender"] = event.sender;

     if(_.isFunction(zThisDataBox["events"]["afterAddDataBox"]))zThisDataBox["events"]["afterAddDataBox"]();

      if(zThisDataBox["isOpen"]){
        zThis.methods.openFileCache(zThisDataBox["boxRootPath"],zThisDataBox["options"]["afterOpenFileCache"], zThisDataBox["events"]["afterOpenFileCache"])
      }

    // 需要自动缓存的资料库，或者在 打开队列中的 资料库 ，直接执行 open
    if (zThisDataBox["isCacheAutoStart"] ) {
      zThis.methods.openFileCache(zThisDataBox["boxRootPath"],zThisDataBox["options"]["afterOpenFileCache"],zThisDataBox["events"]["afterAddDataBox"])
    }




    }catch(err){console.log(err)}
  });


  var zThis = {
    //
    data: {


      //资料库 fileCache对象 列表 （dataBoxFileCacheList）,

      /*dataBoxFileCacheList:{
       // <dataBoxPath>:{
       //     window, BrowserWindow 实例
       //     processSender,  处理资料库数据的子进程， ipc握手通讯中的sender，可以通过processSender.send()向子进程通讯
       //     isOpen:1/0, fileCache是否已打开（DB已经载入）
       //     events：{ // 回调事件集合
       //        afterOpenFileCache:function(err) // switchDataBox后触发的回调函数，如有错误通过 err 返回
       //        afterAddDataBox:function(err)    // addDataBox后触发的回调函数，如有错误通过 err 返回
       //        afterRemoveDataBox:function(err)    // removeDataBox后触发的回调函数，如有错误通过 err 返回
       //     }
       //
       //     boxName, //资料库名称  e.g "full"
       //     boxRootPath, // 资料库的根路径 e.g "C:\test\full"
       //     isCacheForbidden:0/1, // 是否禁止该资料库进行缓存（也不能聚合查找）
       //     isCacheAutoStart：0/1, // 是否在初始化资料库列表时就自动开始该资料库的后台缓存
       //
       //     isFinderQueryOnly:0/1, // 是否 只能使用聚合查找页面，不能看到原始的文件 （该属性为程序根据资料库路径及设置判断后设定，非人工设定）
       //
       //     relatedBoxList: // 关联资料库列表，用于渲染超链接（在“待渲染的字段”中，根据来源字段中实际内容，渲染为链接，链接会打开画面，显示关联资料库中数据来源字段下和待渲染的字段中内容一致的检索结果）
       //     {
       //       <dataBoxName>: { //  key为关联资料库名称
       //         <sourceFieldName>:   // key为关联资料库的数据来源字段名称
       //         [<fieldName1>,<fieldName2>,...], // value为待渲染的字段名称数组
       //       }
       //     }
       //   }
       //  }
       */
      dataBoxFileCacheList: {},

      // 每个 IPC 事件 的 队列数，监听 事件时，事件名会增加 这个数字的后缀
      queueNumList:{
        queryFileCache:0,
        openFileCache:0,
      },


        // 未执行 openFileCache，所有query方法参数 存放的队列
        // 打开后，会执行并删除此队列
        //{<dataBoxPath>:[<参数1>，<参数2>]}
        queryFuncParaList:{

        },

      // 缓存进程 事件{

      // dataBoxFileCacheList:{},

    },
    methods: {


      /*
       根据 数据库的信息，维护 data 中的 fileCacheList，增加 其中某个实例
       //xDataBox，一个dataBox记录
       {
       boxName:"full", //资料库名称
       boxRootPath:"C:\test\full", // 资料库的根路径

       isCacheForbidden:0, // 是否禁止该资料库进行缓存（即不能聚合查找）
       isCacheAutoStart：1, // 是否在初始化资料库列表时就自动开始该资料库的后台缓存

       isFinderQueryOnly:0, // 是否 只能使用聚合查找页面，不能看到原始的文件 （该属性为程序判断，非人工设定）

       relatedBoxList:
       {<dataBoxName>: //资料库名称
       {<sourceFieldName>:   // 关联资料库的 字段名称
       [<fieldName1>,<fieldName2>,...], // 待查询的字段名称
       }}
       */
      addDataBox: function (xDataBox, xCallBack) {

        var zDataBoxObj = xDataBox;

        //若禁止 缓存，则不放到 列表中
        if (zDataBoxObj["isCacheForbidden"])return xCallBack("cacheIsForbidden");

        if (zThis.data.dataBoxFileCacheList[xDataBox["boxRootPath"]]) return xCallBack("dataBoxDuplicated");


        // console.log(xDataBox["boxRootPath"])


        // 增加 新的数据库实例
        zThis.data.dataBoxFileCacheList[xDataBox["boxRootPath"]] = zDataBoxObj;
        zThis.data.dataBoxFileCacheList[xDataBox["boxRootPath"]]["events"] = {afterAddDataBox: xCallBack};
        zThis.data.dataBoxFileCacheList[xDataBox["boxRootPath"]]["options"] = {};

        // 打开新的 fileCache 进程
        zThis.methods.createFileCacheProcess(xDataBox["boxRootPath"]);

      },


      // 创建 fileCache进程
      createFileCacheProcess: function (xBoxRootPath,xCallBack) {
        try{



          var zWinID = new chance().guid();

        var zThisDataBox=zThis.data.dataBoxFileCacheList[xBoxRootPath];

          zThisDataBox["winID"] = zWinID;

        var zFileCacheProcessWindow = new BrowserWindow({width: 1000, height: 800, show: false});
        // 页面url
        var zWinUrl = url.format({
          pathname: path.join(__dirname, "./fileCacheProcess.html"),
          protocol: 'file:',
          slashes: true
        });
        // 增加
        zWinUrl += ("?winID=" + zWinID);

        zFileCacheProcessWindow.loadURL(zWinUrl);

        zFileCacheProcessWindow.webContents.openDevTools();
        //保存 window实例
          zThisDataBox["window"] = zFileCacheProcessWindow;

        // window窗口关闭事件
        zFileCacheProcessWindow.on('closed', () => {
          // 取消引用 window 对象，如果你的应用支持多窗口的话，
          // 通常会把多个 window 对象存放在一个数组里面，
          // 与此同时，你应该删除相应的元素。
          zFileCacheProcessWindow = null;

          // 触发删除回调
          if(_.isFunction(zThisDataBox["events"]["afterRemoveDataBox"])){
            zThisDataBox["events"]["afterRemoveDataBox"]()
          }

          // 当窗口被关闭时，
        });

        }catch(err){
          if(_.isFunction(xCallBack))xCallBack(err);
        }

      },


      //删除 某个资料库实例
      // xDataBox
      removeDataBox: function (xBoxRootPath,xCallBack) {
        try{
        // console.log("doRemove",xBoxRootPath)
        //关闭此fileCache
        // zThis.methods.closeFileCache(xBoxRootPath);
        // 保存回调事件



        var zIfCallBack=false;

        var zThisDataBox = zThis.data.dataBoxFileCacheList[xBoxRootPath];
        if(zThisDataBox && zThisDataBox["events"])  zThisDataBox["events"]["afterRemoveDataBox"]=xCallBack;
        if (zThisDataBox && zThisDataBox["window"]) {
          zThisDataBox["window"].close();
        }else{
          zIfCallBack=true;
        }

        //从列表中删除
        delete zThis.data.dataBoxFileCacheList[xBoxRootPath];

         if(zIfCallBack && _.isFunction(xCallBack))xCallBack()
        }catch(err){
          if(_.isFunction(xCallBack))xCallBack(err);
        }
      },

      //获取资料库的信息
      getDataBox: function (xBoxRootPath) {
        return zThis.data.dataBoxFileCacheList[xBoxRootPath]
      },


      //切换资料库，打开新的资料库fileCache
      // xBoxRootPath:资料库路径，
      switchDataBox: function (xBoxRootPath, xCallBack,xOptions) {

          zThis.methods.openFileCache(xBoxRootPath, xOptions, xCallBack)
      },


      // 根据 资料库名称，获取 data.dataBoxList 对应资料库的数据，
      // 执行fileCache.start()方法
      // xBoxRootPath:资料库路径，
      //  xOptions{
      // isQueryOnly,是否只进行查询，不进行 监听和修改
      //  filterDBTypes,["table"...]， 若有此参数，则只 操作这个参数指定的数据库，否则执行全部数据库
      // }
      // xCallBack(err)
      //    err:出错信息

      openFileCache: function (xBoxRootPath, xOptions, xCallBack) {
        try {
            if(!xOptions)xOptions={};
          zThis.data.queueNumList.openFileCache++;
          // console.log("cc")

            var zThisDataBox = zThis.data.dataBoxFileCacheList[xBoxRootPath];

            if (!zThisDataBox){
                if(_.isFunction(xCallBack))xCallBack({error: "dataBoxNotFound"});
                return
            }
            zThisDataBox["isOpen"]=1;

            // 是否只读
            if(zThisDataBox.isFinderQueryOnly){xOptions["isFinderQueryOnly"]=zThisDataBox.isFinderQueryOnly}
          // 修改 fileCache settings
            if(zThisDataBox.settings)xOptions.settings=zThisDataBox.settings;

            // 若 sender不存在,把回掉方法 以及 options 参数 保存下来，return, 当 握手事件触发后会再次调用此 open 方法
            if (!zThisDataBox["processSender"]){
               zThisDataBox["options"]["afterOpenFileCache"]=xOptions;
               zThisDataBox["events"]["afterOpenFileCache"]=xCallBack;
               return
            }



          // 错误处理回调函数
          var zHandelErr = function (event, err) {
            try{
              if (!_.isFunction(xCallBack))return;
              var zErr=err;
              // 如果err 不是包含 error 属性的对象,包装成 带error参数的对象形式
              if (_.isObject(err) && !err.error) {
                zErr={error: "unknown", rawError: err}
              }

              xCallBack(zErr);

            }catch(err){console.log(err)}
          };

          xOptions["queueNum"]=zThis.data.queueNumList.openFileCache;

          var zCallBackEventName="";
          // 只进行查询时，执行 load数据库方法，
          if (zThisDataBox.isFinderQueryOnly || xOptions["isQueryOnly"]) {
            // 发送 加载数据库 请求
            zThisDataBox["processSender"].send("setupAndLoadDBs", zThisDataBox["boxRootPath"], xOptions);

            zCallBackEventName="setupAndLoadDBsCallBack"+zThis.data.queueNumList.openFileCache;
            // 响应回调请求
            ipcMain.once(zCallBackEventName, zHandelErr)
          }
          // 否则执行 start 方法
          else {
            // 发送 start 请求
            zThisDataBox["processSender"].send("start", zThisDataBox["boxRootPath"], xOptions);


            zCallBackEventName="startCallBack"+zThis.data.queueNumList.openFileCache;


            // 响应 回调请求
            ipcMain.once(zCallBackEventName, zHandelErr)

          }

        } catch (err) {
          if (err && _.isFunction(xCallBack)) xCallBack(err)
        }
      },


      //根据 资料库名称，获取 data.dataBoxList 对应资料库的数据,
      //xBoxRootPath,资料库路径
      //若 usingNum为0,执行 fileCacheManager.close()方法
      closeFileCache: function (xBoxRootPath, xCallBack) {
        try {


          var zDataBoxObj = zThis.data.dataBoxFileCacheList[xBoxRootPath];
          // 关闭 fileCacheManager
          if (!zDataBoxObj)return;

          if (zDataBoxObj["processSender"]) {
            // 发送关闭请求
            zDataBoxObj["processSender"].send("close");
            ipcMain.once('closeCallBack', function (event, err) {
              try{
              if (_.isFunction(xCallBack)) xCallBack(err)
              }catch(err){console.log(err)}
            })

          }
          // 关闭 fileCache进程
          if (zDataBoxObj["window"]) zDataBoxObj["window"].close();


        } catch (err) {
          if (_.isFunction(xCallBack)) xCallBack(err)
        }
      },


      //xBoxRootPath,资料库路径
      // xFilters,筛选条件，xOptions，参数,xCallBack(err,data) 出错信息和返回数据， 详见FileCache.queryDBData
      queryFileCache: function (xBoxRootPath, xFilters, xOptions, xCallBack) {
        try {
          zThis.data.queueNumList.queryFileCache++;
          // console.log("xBoxRootPath",xBoxRootPath)
          // console.log("zThis.data.dataBoxFileCacheList",zThis.data.dataBoxFileCacheList)
          var zThisDataBox = zThis.data.dataBoxFileCacheList[xBoxRootPath];
          if (!zThisDataBox) return xCallBack("dataBoxNotFound");


            // 如果 此资料库 未打开，则只读打开后 再执行 此查询
            if(!zThisDataBox["isOpen"] || !zThisDataBox["processSender"]){
              if(!zThis.data.queryFuncParaList[xBoxRootPath])zThis.data.queryFuncParaList[xBoxRootPath]=[];
                zThis.data.queryFuncParaList[xBoxRootPath].push([xBoxRootPath,xFilters,xOptions,xCallBack]);
                // 无论打开多少此，只有一次回调
                zThis.methods.openFileCache(xBoxRootPath,{ isQueryOnly:1},function (err) {
                    if(err) return xCallBack(err);
                    // 执行所有队列中 的查询
                    _.each(zThis.data.queryFuncParaList[xBoxRootPath],function (xParas) {
                        zThis.methods.queryFileCache(xParas[0],xParas[1], xParas[2], xParas[3])
                    });
                    // 完成后 删除此队列
                    delete  zThis.data.queryFuncParaList[xBoxRootPath]
                });
                return;
            }




            // console.log("xBoxRootPath",xBoxRootPath)
          // console.log( zThis.data.dataBoxFileCacheList)


          xOptions["queueNum"]=zThis.data.queueNumList.queryFileCache;

          zThisDataBox["processSender"].send("queryDBData", xFilters, xOptions);




          // 区分 count和 非count返回事件，
          var zCallBackEventName = "queryDBDataCallBack"+zThis.data.queueNumList.queryFileCache;
          if (xOptions["count"]) zCallBackEventName += "-count";

            console.log("zCallBackEventName",zCallBackEventName)

          ipcMain.once(zCallBackEventName, function (event, err, xData) {
            try{
            // console.log("xData",xData);
            if (_.isFunction(xCallBack)) xCallBack(err, xData)
            }catch(err){  console.log(err)}
          })


        } catch (err) {
          if (_.isFunction(xCallBack)) xCallBack(err)
        }
      }


    }

  };

  _.extend(this, zThis.methods);
  _.extend(this, zThis.data);

};


module.exports = FileCacheManager;