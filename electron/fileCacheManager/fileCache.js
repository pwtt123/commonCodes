/**
 * Created by SE02 on 2018/2/7.
 */


var fs = require('fs');
var path = require('path');
var XLSX = require('xlsx');
var _ = require("underscore");
var Thenjs = require("Thenjs");
var chokidar = require('chokidar');
var Datastore = require('nedb');

var settings = require("./settings");

var zCrypto = require('crypto');


// var iconv = require('iconv-lite');
// var AutoDetectDecoderStream = require('autodetect-decoder-stream')
// var jschardet = require("jschardet")

/*
 用于读取 修改时间 改变的 文件缓存内容，写到 数据库中

 读取单个文件，返回此文件的 聚合缓存 对象数组 ,数组中每个对象项 ，包含 fullPath，sheetName,mtime,memo，row,content 属性
 结构化文件（excel,csv），每一行内容，作为 一个 缓存对象的 row属性，
 非结构化文件，每千字作为  一个 缓存对象 的 content属性
 e.g:
 [
 {
 // 文件路径
 fullPath:"./test/test.xlsx"
 //此行所属的sheet名称
 sheetName:"Sheet1",
 //最后修改时间
 mtime:date,
 //备注
 memo
 //结构化文件每行内容
 row:["A1","B1"],
 // 非结构化文件每千字内容
 content:""
 }，
 ...
 ]

 */

var FileCache = function () {

  var zThis = {
    methods: {},
    data: {},
    events: {},
    settings: {},
  };


  zThis.settings = {};

//私有的数据
  zThis.data = {

    //当前资料库路径
    currentDataBoxPath: "",

    //数据库 size 列表
    //{"./cache.db":{size:222},
    // ...}
    dataBoxCacheFileSizeList: {},


    //缓存的 待更新文件列表
    cacheFilePathList2Update: {},
    //缓存的 待删除文件列表
    cacheFilePathList2Remove: {},

    //fs.watch 资料库 实例
    dataBoxFileWatcher: {},

    //定时 修改缓存 的 定时器
    dataBoxFileCacheUpdater: {},
    //数据库 实例集合
    // {"_fileCache_text.db":{},
    // "_fileCache_aggregate.db":{},
    // }
    dbList: {},


    //是否同步完成，若同步未完成，不会执行 updateDataBoxFileCache 方法
    ifSyncFinished: 0,

    //是否 只进行 query,不进行监听，和缓存
    isFinderQueryOnly: 0

  };


// 响应事件
  zThis.events = {
    /*响应资料库变更事件，修改当前的资料库路径，按规则生成资料库下的 缓存文件路径， 载入此资料库的数据库，
     删除已有的 监听 资料库文件夹 事件，注册新的监听事件，
     获取全文件列表，获取待修改和待删除列表，

     xDataBoxPath,资料库的路径
     xCallBack(err)
     err，错误信息
     */
    onDataBoxPathChanged: function (xDataBoxPath, xCallBack) {
      //执行start
      zThis.methods.start(xDataBoxPath, {}, xCallBack);
    },


    //待更新列表修改
    onFilePathList2UpdateChanged: function (err, xFilePathList2Update) {
    },
    //待删除列表更改
    onFilePathList2RemoveChanged: function (err, xFilePathList2Remove) {
    },

    /*修改完成事件
     xUpdateMessage:{
     //待修改文件 数
     fileNum2Update:zFileNum2Update,
     // 待删除文件 数
     fileNum2Remove:zFileNum2Remove,
     //修改的文件数
     fileNumUpdated:zUpdatedNum,
     //数据库删除的记录数
     rowNumRemoved:zRemovedNum,
     //总共花费的时间
     totalTime:time2-time1,
     //删除花费的时间
     removeTime:removeTime2-removeTime1,
     }
     */
    onCacheUpdated: function (err, xUpdateMessage) {
    },
    //数据库加载完成
    //xLoadedTime 加载完成时间
    onDBLoaded: function (err, xDBType, xLoadedTime) {
    },
    //文件夹监听完成
    //xWatcherReadyTime,监听ready完成时间
    onFileWatcherReady: function (err, xWatcherReadyTime) {
    },
    //一个文件 读取并处理完成
    //xFilePath,加载的文件路径
    // xLoadTime，加载时间
    onFileLoaded: function (err, xFilePath, xLoadTime) {
    },

    //获取到 待修改文件列表
    //xTime 花费的时间
    onFilePathList2UpdateGot: function (err, xTime) {
    },

    //不在可缓存列表中数据删除完成
    //xRowNumRemoved,删除的记录数
    //xTime,花费的时间
    onDataNotInCacheableFilePathListRemoved: function (err, xRowNumRemoved, xTime) {
    },

    //数据库大小改变
    //xDBPath数据库 文件地址
    //xSize，文件大小
    onDBFileSizeChanged: function (err, xDBPath, xSize) {
    }

  };


// 私有的方法
  zThis.methods = {

    /* 开始执行 fileCacheManager,错误信息会在回调中返回
     xDataBoxPath,资料库路径
     xOptions，参数
     xCallBack(err)
     //err:错误信息，
     dbFileSizeExceed:数据库大小超过上限
     xEvents, // zThis.events 中增加的事件，详见events
     ,
     */
    start: function (xDataBoxPath, xOptions, xCallBack, xEvents) {
      if (!xOptions) xOptions = {};
      // console.log("start", xDataBoxPath);

      zThis.settings = _.clone(FileCache.settings);
      if (xOptions["settings"]) {
        _.extend(zThis.settings, xOptions.settings);
      }

      //执行关闭方法
      zThis.methods.close();


      //如果 xEvents 是对象，extend现有的 events
      if (_.isObject(xEvents)) _.extend(zThis.events, xEvents);

      var zIsDataBoxChanged = false;
      if (zThis.data.currentDataBoxPath != xDataBoxPath) zIsDataBoxChanged = true;

      //修改 私有的 当前资料库名
      zThis.data.currentDataBoxPath = xDataBoxPath;


      var zLoadOptions = xOptions;
      zLoadOptions["isDataBoxChanged"] = zIsDataBoxChanged;
      // 初始化，并 load 所有数据库
      zThis.methods.setupAndLoadDBs(xDataBoxPath, zLoadOptions, xCallBack);


      //建立新的 watcher事件
      zThis.methods.setupDataBoxFileWatcher(function (err, xAllFilePathList) {


        if (err && _.isFunction(xCallBack)) xCallBack(err);

        //载入并处理所有文件路径列表
        zThis.methods.syncDiskData2DB(xAllFilePathList);

      });


      //设定定时修改参数 定时器
      zThis.methods.setupDataBoxFileCacheUpdater(function (err) {
        if (err && _.isFunction(xCallBack)) xCallBack(err);
      });

    },
    /*
     关闭fileCache,包括
     * 文件夹 监听
     * 关闭 数据库
     * 关闭 定时 触发修改缓存 函数
     全部关闭后执行回调
     // xCallBack(err)
     //err，错误信息
     */
    close: function (xCallBack) {
      //若存在 旧的监听事件，关闭它
      var zWatcher = zThis.data.dataBoxFileWatcher;
      if (_.isFunction(zWatcher.close)) {
        //console.log("close");
        zWatcher.close();
      }
      ;
      //  关闭 dataBoxFileCacheUpdater, 定时修改的定时器
      clearInterval(zThis.data.dataBoxFileCacheUpdater);


      if (_.isFunction(xCallBack)) xCallBack()
    },


    //根据 后缀名映射表，生成不同的 数据库 实例，存放在 data.dbList中,并加载数据库
    //xOptions{
    // isDataBoxChanged:true/false ,资料库是否改变,若未改变,已加载的数据库不会重新加载
    //  filterDBTypes:["table"/..] 筛选的数据库,若有此参数,只 加载 此数组中的 数据库
    // }
    setupAndLoadDBs: function (xDataBoxPath, xOptions, xCallBack) {
      if (!xOptions) xOptions = {};

      zThis.settings = _.clone(FileCache.settings);
      if (xOptions["settings"]) {
        _.extend(zThis.settings, xOptions.settings);
      }

      // console.log("settings",zThis.settings);
      // 根据 数据库文件名 分组后的 后缀名 映射表，
      var zGroupByDBs = {};

      var zDataBoxPath = xDataBoxPath;

      //parallelLimit 方法集合
      var zParallelFuncs = [];


      if (xOptions["isFinderQueryOnly"]) {
        zThis.data.isFinderQueryOnly = xOptions["isFinderQueryOnly"];
      }

      zThis.methods.mkDBDirAndFlag(xDataBoxPath);

      _.each(zThis.settings.extMappingList, function (xDBTypeObj, xDBType) {
        console.log("gg",xDBType)
        // 若数据库已加载,则return
        if (!xOptions.isDataBoxChanged && zThis.methods.checkIfDBLoaded(xDBType)) return xCallBack() ;

        console.log("hh",xDBType)
        // 若 不在 筛选的 DBType 中,返回
        if (xOptions.filterDBTypes && _.indexOf(xOptions.filterDBTypes, xDBType) == -1)return xCallBack();


        var zDBPath = zThis.methods.getDBPath(xDBType, zDataBoxPath);
        //路径 存到 data 中
        zThis.data.dataBoxCacheFileSizeList[zDBPath] = {DBType: xDBType};
        //初始化 数据库对象
        zThis.data.dbList[xDBType] = new Datastore({
          filename: zDBPath,
          afterSerialization: function (xData) {
            var zCipher = zCrypto.createCipher(zThis.settings.DBCryptoAlgorithm, zThis.settings.pwd4DB);
            var zEncrypted = zCipher.update(xData, 'utf8', 'hex');
            zEncrypted += zCipher.final('hex');
            // console.log(zEncrypted);

            return zEncrypted
          },
          beforeDeserialization: function (xData) {
            var decipher = zCrypto.createDecipher(zThis.settings.DBCryptoAlgorithm, zThis.settings.pwd4DB);

            var zEncrypted = xData;
            var zDecrypted = decipher.update(zEncrypted, 'hex', 'utf8');
            zDecrypted += decipher.final('utf8');
            // console.log(zDecrypted);

            return zDecrypted
          }
        });

        zThis.data.dbList[xDBType].ensureIndex({fieldName: 'fullPath'}, function (err) {
          if (err) console.log(err);
        });

        //每一个回调方法
        var zFunc = function (cont) {

          var time1 = new Date();
          //加载数据库
          zThis.data.dbList[xDBType].loadDatabase(function (err) {


            var time2 = new Date();

            try {
              zThis.events.onDBLoaded(err, xDBType, time2 - time1);
            } catch (err) {
              console.log(err)
            }
            //console.log("数据库加载完毕",time2-time1);

            return cont(err);
          });


        };


        zParallelFuncs.push(zFunc)
      });


      //parallel,并行执行所有修改方法
      Thenjs.parallelLimit(zParallelFuncs, 10)
      //所有方法执行完成，返回修改后的 缓存对象
        .then(function (cont, result) {

          if (_.isFunction(xCallBack)) xCallBack(null);

          cont();

        })
        //返回出错信息
        .fail(function (cont, error) {
          //console.log("err",error)
          if (_.isFunction(xCallBack)) xCallBack(error);
        });


    },

    // 检查 db是否 加载
    checkIfDBLoaded: function (xDBType) {
      var zReturn = false;
      if (zThis.data.dbList[xDBType] && _.isFunction(zThis.data.dbList[xDBType].find)) {
        zReturn = true;
      }
      return zReturn;
    },

    // 创建 DB目录 和 flag文件，防止后续程序出错
    mkDBDirAndFlag: function (xDataBoxPath) {
      // 若只读，在当前数据库下 创建 flag文件
      if (zThis.data.isFinderQueryOnly) {
        var zFlagFilePath = path.join(xDataBoxPath, zThis.settings.IsFinderQueryOnlyFlagFileName);

        try {
          fs.writeFileSync(zFlagFilePath, "")
        } catch (err) {
        }
        ;
      }
      //不是只读，在 资料库同级目录创建 总的数据库文件夹， 创建 此文件夹中 创建 资料库的数据库目录，在目录中创建flag文件
      else {

        var zDBDirPath = path.join(xDataBoxPath, "../", zThis.settings.DBDirRelativePath);

        try {
          // 创建 总的数据库文件夹
          fs.mkdirSync(zDBDirPath)
        } catch (err) {
        }

        var zDataBoxBaseName = path.basename(xDataBoxPath);
        var zDataBoxDBDirPath = path.join(zDBDirPath, zDataBoxBaseName + zThis.settings.dataBoxDBDirSuffix);
        // 创建 此资料库的文件夹
        try {
          fs.mkdirSync(zDataBoxDBDirPath)
        } catch (err) {
        }
        var zFlagFilePath = path.join(zDataBoxDBDirPath, zThis.settings.IsFinderQueryOnlyFlagFileName);
        try {
          fs.writeFileSync(zFlagFilePath, "")
        } catch (err) {
        }


      }
    },

    // 根据 规则生成 获取db路径
    //xDBType:"text"/"table"/..
    //xDataBoxPath:"./dataBox"
    //return <dbPath>
    getDBPath: function (xDBType, xDataBoxPath) {
      // console.log("getDBPath",xDataBoxPath)
      var zDBFilerName = zThis.settings.DBFilePrefixName + xDBType + ".db";

      var zDBPath;
      if (zThis.data.isFinderQueryOnly) {
        zDBPath = path.join(xDataBoxPath, zDBFilerName);
      } else {
        var zDataBoxBaseName = path.basename(xDataBoxPath);
        zDBPath = path.join(xDataBoxPath, "../", zThis.settings.DBDirRelativePath, zDataBoxBaseName + zThis.settings.dataBoxDBDirSuffix, zDBFilerName);
      }


      // console.log("zDBPath",zDBPath)
      return zDBPath

    },


    //根据文件路径，获取 此文件 对应的 extMapping对想以及 db对象，
    // 文件路径
    //return {
    // extMapping,此文件对应的 映射表
    // db,此文件对应的 数据库实例
    // }
    getFileExtMappingAndDB: function (xFilePath) {
      var zSuffixName = zThis.methods.getFileSuffixName(xFilePath);
      // 返回对象
      var zReturnObj = {
        // 对应的 extMapping
        extMapping: {},
        // 对应的 数据库 实例
        db: {}
      };
      //循环每个 DBType
      _.each(zThis.settings.extMappingList, function (xExtObj, xDBType) {
        //  若 DBType 下的 扩展名 和 文件路径一致，作为返回结果
        if (_.indexOf(xExtObj["exts"], zSuffixName) != -1) {
          zReturnObj.extMapping = zThis.settings.extMappingList[xDBType];
          zReturnObj.db = zThis.data.dbList[xDBType]
        }

      });

      return zReturnObj;
    },

    //获取文件 (toLowerCase之后)的扩展名
    //xFilePath,文件路径
    //return "txt"/""/"md"/...
    getFileSuffixName: function (xFilePath) {
      // console.log("getFileSuffixName",xFilePath)
      var zIndexOf = xFilePath.lastIndexOf(".");
      var zSuffixName = "";

      if (zIndexOf != -1) zSuffixName = xFilePath.substr(zIndexOf + 1).toLowerCase();
      return zSuffixName
    },

    /*删除已有的 监听 资料库文件夹 事件，注册新的监听事件,监听事件read 后返回全文件列表
     修改的文件 经过是否可缓存删选后，放到 待修改或待删除列表中
     其中，若监听到 数据库文件的改动，把 size放到 data中,不放到待修改列表
     xCallBack（err，xAllFilePathList）,watch建立完成后的回调
     err，出错信息
     xAllFilePathList,watch建立完成时，的所有文件列表
     */
    setupDataBoxFileWatcher: function (xCallBack) {
      var time1 = new Date();
      var zDataBoxPath = zThis.data.currentDataBoxPath;
      //若存在 旧的监听事件，关闭它
      var zWatcher = zThis.data.dataBoxFileWatcher;
      if (_.isFunction(zWatcher.close)) {
        //console.log("close");
        zWatcher.close();
      }

      //忽略的文件路径， \~$,excel临时文件 、\.~，md 临时文件
      var zIgnored = /(\\~\$)|(\\\.\~)/;
      //初始化 watch 事件
      //ignored: 忽视的文件路径，打开和关闭excel生成的临时文件、缓存JOSN文件
      //persistent,只要正在监视文件，进程是否应该继续运行,如果设置为 false，即使过程继续运行，也不会再有事件发生。
      zThis.data.dataBoxFileWatcher = chokidar.watch(zDataBoxPath, {
        ignored: zIgnored,
        persistent: true
      });

      //是否所有文件已载入，避免载入文件触发的 add 事件
      var zIfReady = false;


      var zAllFileStatList = {};
      zThis.data.dataBoxFileWatcher
      //文件被添加
        .on('add', function (xPath, xStats) {
          //console.log("add",xPath,xStats);

          var zFileMessage = _.pick(xStats, "mtime");

          //在没有 建立watch完成时,
          if (!zIfReady) {
            //若 是 数据库文件,储存数据库的大小
            if (zThis.data.dataBoxCacheFileSizeList[xPath]) {

              zThis.data.dataBoxCacheFileSizeList[xPath]["size"] = xStats.size;
              try {
                zThis.events.onDBFileSizeChanged(null, xPath, xStats.size)
              } catch (err) {
                console.log(err)
              }
              return;
            }
            // 其他所有的Path 放在  全文件列表 中
            zAllFileStatList[xPath] = zFileMessage;
            return;
          }
          //建立 watch完成后的 路径，直接增加到 待修改列表中
          addPath2CacheFilePathList(xPath, zFileMessage, "update");
        })
        //文件被修改
        .on('change', function (xPath, xStats) {
          //console.log("change",xPath,xStats)

          var zFileMessage = _.pick(xStats, "mtime", "size");

          //增加到 待修改列表中
          addPath2CacheFilePathList(xPath, zFileMessage, "update");

        })
        //文件被删除
        .on('unlink', function (xPath) {
          //console.log("remove",xPath)
          //增加到 待删除列表中
          addPath2CacheFilePathList(xPath, {}, "remove");
        })
        //文件夹被添加
        .on('addDir', function (xPath) {
          //console.log("addDir",xPath)
        })
        //文件夹被删除
        .on('unlinkDir', function (xPath) {
          //console.log("unlinkDir",xPath)
        })
        //出错信息
        .on('error', function (err) {
          try {
            zThis.events.onFileWatcherReady(err);
          } catch (err) {
            console.log(err)
          }

          if (_.isFunction(xCallBack)) xCallBack(err)
        })
        //所有文件加载完
        .on('ready', function () {
          var time2 = new Date();

          try {
            zThis.events.onFileWatcherReady(null, time2 - time1);

          } catch (err) {
            console.log(err)
          }
          //console.log("watched",time2-time1);
          zIfReady = true;
          xCallBack(null, zAllFileStatList);
        });


      //增加文件路径 到 待修改或待删除列表
      function addPath2CacheFilePathList(xPath, xFileMessage, xListType) {
        //如果 路径没有后缀名(打开/关闭excel会生成/删除 临时没有后缀名的文件)，return
        if (xPath.indexOf(".") == -1)return;

        //如果路径 是数据库路径，修改 储存的数据库大小，返回
        if (zThis.data.dataBoxCacheFileSizeList[xPath]) {
          // console.log("addPath2CacheFilePathList",xPath,xFileMessage,xListType)

          zThis.data.dataBoxCacheFileSizeList[xPath]["size"] = xFileMessage.size;

          try {
            zThis.events.onDBFileSizeChanged(null, xPath, xFileMessage.size)
          } catch (err) {
            console.log(err)
          }

          return
        }

        var zFileMessage = xFileMessage ? xFileMessage : {};
        var zFileObj = {[xPath]: zFileMessage};
        //判断此文件是否在可缓存
        var zCacheableFileList = zThis.methods.getCacheableFilePathList(zFileObj);
        //不在可缓存数据，return
        if (_.isEmpty(zCacheableFileList))return;

        // console.log(xPath,xListType)
        //增加到 删除或修改列表中
        if (xListType == "update") {
          //console.log("update",xPath)
          //若 待修改列表中 没有此 文件，则增加此文件
          if (!zThis.data.cacheFilePathList2Update[xPath]) zThis.data.cacheFilePathList2Update[xPath] = zFileMessage;
          // 若有此文件，只改变此文件的 mtime
          else {
            _.extend(zThis.data.cacheFilePathList2Update[xPath], zFileMessage);
          }

          // console.log("cacheFilePathList2Update",zThis.data.cacheFilePathList2Update)

          try {
            zThis.events.onFilePathList2UpdateChanged(null, zThis.data.cacheFilePathList2Update)
          } catch (err) {
            console.log(err)
          }
        }
        if (xListType == "remove") {
          //console.log("remove",xPath)

          _.extend(zThis.data.cacheFilePathList2Remove, zFileObj);

          try {
            zThis.events.onFilePathList2RemoveChanged(null, zThis.data.cacheFilePathList2Remove)
          } catch (err) {
            console.log(err)
          }
        }

      }

    },

    //定时 根据待修改列表和待删除列表 修改 缓存对象的值
    setupDataBoxFileCacheUpdater: function (xCallBack) {
      //间隔时间
      var zUpdateIntervalTime = zThis.settings.intervalTime2UpdateCache;

      //定时执行 检查是否要修改缓存 事件
      zThis.data.dataBoxFileCacheUpdater = setInterval(function () {
        zThis.methods.checkAndRunUpdateDataBoxFileCache(xCallBack)
      }, zUpdateIntervalTime);
    },

    /*清除原有的待修改以及待删除列表， 根据 所有文件列表，生成待修改列表以及 待删除列表，
     xAllFilePathList，所有文件路径列表
     xCallBack(err)，回调
     err,错误信息
     */
    syncDiskData2DB: function (xAllFilePathList, xCallBack) {
      //是否缓存结束，设为0
      zThis.data.ifSyncFinished = 0;
      //清空 待删除列表 和 待修改列表
      _.each(zThis.data.cacheFilePathList2Remove, function (xObj, xIndex) {
        delete zThis.data.cacheFilePathList2Remove[xIndex]
      });
      _.each(zThis.data.cacheFilePathList2Update, function (xObj, xIndex) {
        delete zThis.data.cacheFilePathList2Update[xIndex]
      });

      //获取可缓存列表
      var zCacheableFilePathList = zThis.methods.getCacheableFilePathList(xAllFilePathList);

      //旧的 资料库路径
      var zOldDataBoxPath = zThis.data.currentDataBoxPath;

      //删除 数据库中存在，但可缓存列表中不存在的记录，
      zThis.methods.removeDocsNotInCacheableFilePathList(zCacheableFilePathList, function (err) {
        if (err && _.isFunction(xCallBack))return xCallBack(err);
        //同步完成
        zThis.data.ifSyncFinished = 1;

        //获取 可缓存列表中的 待修改文件列表，增加到 data的待修改列表中（回调后，待修改列表中可能会有值）
        zThis.methods.getCacheFilePathList2Update(zCacheableFilePathList, function (err, xCacheFileList2Update) {
          //console.log("xCacheFilePathList2Update",xCacheFilePathList2Update)

          //新的 资料库路径
          var zNewDataBoxPath = zThis.data.currentDataBoxPath;

          //若 新旧资料库路径不等，return;
          if (zNewDataBoxPath != zOldDataBoxPath) return;
          //增加到 待修改列表中
          _.each(xCacheFileList2Update, function (xFileObj, xFilePath) {
            //若 此路径不在修改列表哦中，增加到修改列表中
            if (!zThis.data.cacheFilePathList2Update[xFilePath]) {
              zThis.data.cacheFilePathList2Update[xFilePath] = xFileObj
            }
            //存在修改列表中，增加mtime属性
            else {
              _.extend(zThis.data.cacheFilePathList2Update[xFilePath], xFileObj)
            }
          });


          // console.log("cacheFilePathList2Update",zThis.data.cacheFilePathList2Update)
          try {
            zThis.events.onFilePathList2UpdateChanged(null, zThis.data.cacheFilePathList2Update);
          } catch (err) {
            console.log(err)
          }
          if (_.isFunction(xCallBack)) xCallBack(err);

        });


      });


    },

    //检查是否要执行 修改缓存数据函数，若通过，则执行 修改函数
    checkAndRunUpdateDataBoxFileCache: function (xCallBack) {
      //若db未定义，不执行修改
      if (_.isEmpty(zThis.data.dbList))return;

      //若待修改和 待删除列表均为空 不执行修改
      if (_.isEmpty(zThis.data.cacheFilePathList2Remove) && _.isEmpty(zThis.data.cacheFilePathList2Update))return;

      //若同步未完成，不执行修改缓存事件
      if (!zThis.data.ifSyncFinished)return;

      var zDataBoxPath = zThis.data.currentDataBoxPath;
      //执行修改缓存事件
      zThis.methods.updateDataBoxFileCache(zDataBoxPath, function (err) {
        if (err && _.isFunction(xCallBack)) xCallBack(err)
      });
    },


    /*
     数据库 修改 资料库的缓存,
     从 待修改文件列表中，调用对应文件的load方法，取的数据后，删除原有的记录，插入取得的记录
     从 待删除文件列表中，删除 数据库 对应的文件记录

     xUpdateDataBoxPath,需要修改的资料库路径，用来回调后判断与当前路径是否一致，不一致不操作data中的属性
     xCallBack(err)回调函数
     err，错误信息

     */
    updateDataBoxFileCache: function (xUpdateDataBoxPath, xCallBack) {
      var time1 = new Date();
      //console.log("开始修改缓存");


      //测试 相关


      var zFileNum2Update = _.keys(zThis.data.cacheFilePathList2Update);
      var zFileNum2Remove = _.keys(zThis.data.cacheFilePathList2Remove);


      //获取当前 待删除列表的 key 集合
      var xCacheFilePathList2RemoveList = _.groupBy(zThis.data.cacheFilePathList2Remove, function (xObj) {
        return xObj["dataBoxFileCacheName"]
      });

      //待删除列表
      var xCacheFilePathList2RemoveArray = _.keys(zThis.data.cacheFilePathList2Remove);

      var zUpdatedNum = 0;
      var zRemovedNum = 0;
      //删除 缓存事件

      // thenjs parallel 并行执行方法集合
      var zParallelFuncs = [];


      //从待删除列表中，删除已删除的项
      _.each(xCacheFilePathList2RemoveArray, function (xPath) {
        delete zThis.data.cacheFilePathList2Remove[xPath]
      });

      //循环 所有数据库
      _.each(zThis.data.dbList, function (xDB, xDBType) {
        var zDB = xDB;
        var zRemoveFunc = function (cont) {
          if (!xCacheFilePathList2RemoveArray.length) return cont();
          //console.log("执行删除")
          //删除 需要删除的 属性, multi:true，允许删除多个文件
          zDB.remove({fullPath: {$in: xCacheFilePathList2RemoveArray}}, {multi: true}, function (err, numRemoved) {

            // console.log("deleted",numRemoved)
            zRemovedNum += numRemoved;
            return cont();
          });
        };

        zParallelFuncs.push(zRemoveFunc)
      });


      //循环 待修改文件列表
      _.each(zThis.data.cacheFilePathList2Update, function (xFileObj, xFilePath) {

        if (!xFileObj.db) return console.log("dbNotFound");
        var zDB = xFileObj.db;
        if (!xFilePath)return;


        // 获取文件的后缀名
        var zSuffixName = zThis.methods.getFileSuffixName(xFilePath);
        //判断此后缀名 是否有对应的 load方法，若没有return,并且从待删除列表中删除

        if (!xFileObj["extMapping"] || !_.isFunction(xFileObj["extMapping"]["loadFunc"])) {
          delete zThis.data.cacheFilePathList2Update[xFilePath];
          return;
        }
        var zLoadFunc = xFileObj["extMapping"]["loadFunc"];
        //parallel 其中一个方法


        var zFunc = function (cont) {
          //console.log("执行修改")


          //若 这个文件正在被 修改，跳过
          if (xFileObj["isUpdating"])return cont();


          //此 文件 正在被 修改
          zThis.data.cacheFilePathList2Update[xFilePath]["isUpdating"] = 1;

          var loadTime1 = new Date();

          var zOptions = {
            // 分割文本的字符长度
            cacheContentLength: zThis.settings.cacheContentLength,
            // 列头标记
            excelHeaderMark: zThis.settings.excelHeaderMark,
            // 列尾标记
            excelFooterMark: zThis.settings.excelFooterMark,
            //最大合并单元格处理上限
            maxCellNum2FillMerges: zThis.settings.maxCellNum2FillMerges,
          };

          //执行load方法
          zLoadFunc(xFilePath, xFileObj, zOptions, function (err, xData) {

            // if(err)console.log(err)
            // console.log("loadFile",xData)

            var loadTime2 = new Date();

            // console.log("fileLoaded",err,xFilePath,xData)
            try {
              zThis.events.onFileLoaded(err, xFilePath, loadTime2 - loadTime1);
            } catch (err) {
              console.log(err)
            }

            //若有错，或者xData为空，return
            if (err || !xData) {
              console.log("err", err)
              delete zThis.data.cacheFilePathList2Update[xFilePath];
              return cont();
            }

            zUpdatedNum += xData.length;
            //回调完成时，当前的资料库路径
            var zCurrentDataBoxPath = zThis.data.currentDataBoxPath;
            //当回调后资料库没有改变
            if (xUpdateDataBoxPath == zCurrentDataBoxPath) {


              var zDBType = "";
              if (xFileObj["extMapping"] && xFileObj["extMapping"]["DBType"]) zDBType = xFileObj["extMapping"]["DBType"];

              var zDBPath = zThis.methods.getDBPath(zDBType, zCurrentDataBoxPath);
              //执行update一条记录之前 检查 db文件是否超过上限，超过的话 返回错误
              if (zThis.methods.checkIfDBFileSizeExceed(xData, zDBPath)) {
                // console.log("超过上限",xFileObj);
                //从带修改列表中删除
                delete zThis.data.cacheFilePathList2Update[xFilePath];

                return cont({error: "dbFileSizeExceed", detail: {DBType: zDBType, DBPath: zDBPath}});

              }
              //删除 数据库中 此文件 原有的记录
              zDB.remove({fullPath: xFilePath}, {multi: true}, function (err) {
                if (err) console.log("err", err);

                // console.log("loaded",xData)

                //数据库 新增 此文件的 新的记录
                zDB.insert(xData, function (err) {
                  if (err) console.log("err", err);
                  //此文件 修改完成,从待修改列表中删除 此文件
                  delete zThis.data.cacheFilePathList2Update[xFilePath];

                  //console.log("修改完成")
                  cont(null, xFilePath)
                });
              });

              //zReturnDataBoxFilesCache[xFilePath] = xData;
            } else {

              cont()
            }

          })

        };

        //增加到 thenjs parallel 方法集合中
        zParallelFuncs.push(zFunc)
      });


      //parallel,并行执行所有修改方法
      Thenjs.parallelLimit(zParallelFuncs, 20)
      //所有方法执行完成，返回修改后的 缓存对象
        .then(function (cont, result) {

          var time2 = new Date();


          //回调完成时，当前的资料库路径
          var zCurrentDataBoxPath = zThis.data.currentDataBoxPath;

          try {
            zThis.events.onCacheUpdated(null
              ,
              {
                fileNum2Update: zFileNum2Update,
                fileNum2Remove: zFileNum2Remove,
                rowNumUpdated: zUpdatedNum,
                rowNumRemoved: zRemovedNum,
                totalTime: time2 - time1,

              }
            );
          } catch (err) {
            console.log(err)
          }

          //console.log("修改缓存完毕", time2 - time1);

          if (_.isFunction(xCallBack)) xCallBack(null);

          cont();

        })
        //返回出错信息
        .fail(function (cont, error) {
          //console.log("err",error)
          if (_.isFunction(xCallBack)) xCallBack(error);
        });

    },

    //检查db文件大小是否超过上限,把需要插入的数据 和 db文件的大小加起来的字节数，和上限字节数比较
    //xData,需要插入的数据
    //return true/false, 超过/未超过
    checkIfDBFileSizeExceed: function (xData, xDBPath) {

      // console.log("checkIfDBFileSizeExceed",xDBPath)

      var zResult = true;
      try {
        //增加的字节数
        var zAddSize = 0;

        // 加密需要插入的数据，获取字节数
        var zCipher = zCrypto.createCipher(zThis.settings.DBCryptoAlgorithm, zThis.settings.pwd4DB);
        var zEncrypted = zCipher.update(xData.toString(), 'utf8', 'hex');
        zEncrypted += zCipher.final('hex');
        zAddSize = zEncrypted.length;

        //   if(xData)zAddSize =JSON.stringify(xData).length;
        // //考虑到中文的情况，字节数*1.5
        // zAddSize=zAddSize*1.5;

        // console.log("dataBoxCacheFileSizeList",zThis.data.dataBoxCacheFileSizeList[xDBPath])

        if (!zThis.data.dataBoxCacheFileSizeList[xDBPath]) return zResult;

        //当前数据库 大小
        var zSize = 0;
        if (zThis.data.dataBoxCacheFileSizeList[xDBPath]["size"]) zSize = zThis.data.dataBoxCacheFileSizeList[xDBPath]["size"];

        // console.log("dataBoxCacheFileSizeList",zThis.data.dataBoxCacheFileSizeList[xDBPath])
        // console.log("MAX_CACHE_FILE_SIZE",zThis.settings.MAX_CACHE_FILE_SIZE)


        // console.log(zThis.settings.MAX_CACHE_FILE_SIZE)
        //若 增加后的字节数 超过文件上限大小
        if (zSize + zAddSize > zThis.settings.MAX_CACHE_FILE_SIZE) {
          zResult = true;
        } else {
          zResult = false;
        }

      } catch (err) {
        console.log("err", err)
      }
      return zResult;
    },


    /*
     返回可缓存的文件列表

     xAllFilePathList，当前资料库 所有文件路径列表
     return，后缀名 在可缓存文件中的 所有文件路径列表
     */
    getCacheableFilePathList: function (xAllFilePathList) {

      //console.log("cacheable",xAllFilePathList)

      //从对照表中获取 可缓存的后缀名 集合
      var zCacheableSuffixNames = []
      //循环每个 DBType
      _.each(zThis.settings.extMappingList, function (xExtMapping, xDBType) {
        // 循环 此DBType 下的 后缀名
        _.each(xExtMapping["exts"], function (xExtName) {
          //放到 后缀名集合中
          zCacheableSuffixNames.push(xExtName)
        })
      })


      //可缓存 文件列表
      var zCacheableFilePathList = {};
      //处理每个文件路径
      _.each(xAllFilePathList, function (xFileObj, xFilePath) {
        // console.log(xFilePath)


        // 获取 文件 后缀名

        var zSuffixName = zThis.methods.getFileSuffixName(xFilePath);

        //后缀名不在 缓存后缀名列表中，return
        if (_.indexOf(zCacheableSuffixNames, zSuffixName) == -1)return;

        zCacheableFilePathList[xFilePath] = xFileObj;

        //获取此文件的 extMapping和db
        var zDBAndExtMapping = zThis.methods.getFileExtMappingAndDB(xFilePath);
        //放到返回结果中
        _.extend(zCacheableFilePathList[xFilePath], zDBAndExtMapping)
      });


      // console.log("zCacheableFilePathList",zCacheableFilePathList)

      //返回 结果
      return zCacheableFilePathList

    },

    /*
     返回待修改文件列表
     stat 获取所有可缓存的文件信息，
     判断 数据库中，是否存在 fullPath一致的记录，若不存在 放到 需要修改文件列表中
     若存在 再判断 数据库中 是否 有 mTime 不一致，但fullPath一致的文件，有存放到 待修改列表中

     xCacheableFilePathList,可缓存文件列表，
     xCallBack(err,xData)，
     err:错误信息
     xData:待修改文件列表
     */
    getCacheFilePathList2Update: function (xCacheableFilePathList, xCallBack) {


      var time1 = new Date()

      // thenjs parallel 并行执行方法集合
      var zParallelFuncs = [];

      var zCacheFileList2Update = {};

      _.each(xCacheableFilePathList, function (xFileObj, xFilePath) {
          //console.log("xCacheableFilePathList",xCacheableFilePathList)
          var zDB = xFileObj.db;
          // 其中的一个方法
          var zFunc = function (cont) {

            // 查看数据库中 fullPath相等 的数据 是否存在，不存在放到 待修改列表中
            zDB.findOne({fullPath: xFilePath}, function (err, xDoc) {
              if (err)return cont(err);
              //不存在数据，返回文件路径
              if (!xDoc) {
                zCacheFileList2Update[xFilePath] = xFileObj;
                return cont(null, xFilePath);
              }
              //存在，查看 fullPath相等，时间不等(防止更新一半的情况，不能查时间相等) 的数据 是否存在，存在，放到更新列表中
              else {
                //var zDateForMated=xFileMessage["mtime"].format("yyyy-MM-dd hh:mm:ss");
                zDB.findOne({fullPath: xFilePath, mtime: {$ne: xFileObj["mtime"]}}, function (err, xxDoc) {
                  if (err)return console.log(err);
                  //console.log("xDocs",xxDoc)
                  //不存在 返回空
                  if (!xxDoc)return cont();
                  //存在，返回文件路径
                  zCacheFileList2Update[xFilePath] = xFileObj;
                  return cont(null, xFilePath)
                })
              }
            });

          };

          zParallelFuncs.push(zFunc)
        }
      );

      //parallel,并行执行所有方法,limit:100 最大同时执行的数量
      Thenjs.parallelLimit(zParallelFuncs, 20)
      //返回所有方法的结果，待修改返回文件路径，无需修改返回空
        .then(function (cont, result) {
          var time2 = new Date();
          var zResult = _.compact(result);

          //console.log("获取待修改列表",time2-time1,zCacheFileList2Update);

          try {
            zThis.events.onFilePathList2UpdateGot(null, time2 - time1);
          } catch (err) {
            console.log(err)
          }

          //callBack 返回数据
          if (_.isFunction(xCallBack)) xCallBack(null, zCacheFileList2Update);
          cont();

        })
        //返回出错信息
        .fail(function (cont, err) {

          try {
            zThis.events.onFilePathList2UpdateGot(err);
          } catch (err) {
            console.log(err)
          }
          if (_.isFunction(xCallBack)) xCallBack(err);
        });

    },

    /*删除 不在可缓存 列表中的 数据库中的记录
     xCacheableFilePathList,可缓存文件列表，
     xCallBack(err)，
     err:错误信息
     */
    removeDocsNotInCacheableFilePathList: function (xCacheableFilePathList, xCallBack) {



      //console.log("xCacheableFilePathList",xCacheableFilePathList)
      //待缓存文件路径集合
      var zFilePathArray = _.keys(xCacheableFilePathList);

      var zParallelFuncs = [];
      _.each(zThis.data.dbList, function (xDB, xDBType) {
        var zDB = xDB;
        //删除 fullPath 不在 可缓存列表中的 所有数据
        var zRemoveFunc = function (cont) {
          var time1 = new Date();
          zDB.remove({fullPath: {$nin: zFilePathArray}}, {multi: true}, function (err, xNum) {

            var time2 = new Date();
            try {
              zThis.events.onDataNotInCacheableFilePathListRemoved(err, xDBType, xNum, time2 - time1);
            } catch (err) {
              console.log(err)
            }
            //if(xNum)console.log("已删除 "+xNum+" 条",time2-time1)
            return cont(err)
          })
        }
        zParallelFuncs.push(zRemoveFunc)
      })

      //parallel,并行执行所有修改方法
      Thenjs.parallelLimit(zParallelFuncs, 10)
      //所有方法执行完成，
        .then(function (cont, result) {

          if (_.isFunction(xCallBack)) xCallBack(null);

          cont();

        })
        //返回出错信息
        .fail(function (cont, error) {
          //console.log("err",error)
          if (_.isFunction(xCallBack)) xCallBack(error);
        });


    },


    /*获取 数据库的数据
     // xFilters，find的查询语句
     // {"fullPath":"testData\\test22.xlsx","row.4":{$gt:40,$lt:45}};

     // xOption:{
     "skip":0,
     limit:50,
     sort:{"row.4":1},
     count:1, 有此字段，只返回统计结果
     DBType:"table"/"text"/...,查询的数据库 类型
     keyword,"xxx^yyy|zzz", 有此字段，会根据规则生成 筛选条件
     projections,{header:1/0},只返回或不反回某个字段
     headerKeywordList:{客户:"张"}，根据此列表，生成record.客户:{$regex:/张/}的查询条件
     };

     xCallBack(err,xDocs)
     err，错误
     xDocs，取得的数据
     */
    queryDBData: function (xFilters, xOptions, xCallBack) {
      if (!xOptions) xOptions = {};
      if (!xOptions || !xOptions["DBType"] || !zThis.data.dbList[xOptions["DBType"]])return xCallBack("DBTypeNotFound");
      var zMaxLimitNum = zThis.settings.maxQueryLimitNum;
      var zDB = zThis.data.dbList[xOptions["DBType"]];

      var zErr;
      var zFilters = xFilters ? xFilters : {};

      if (!zFilters["$and"]) zFilters["$and"] = [];

      if (xOptions && xOptions["keyword"]) {
        zThis.methods.setFiltersBySourceKeyword(xOptions["keyword"], xOptions["DBType"], zFilters)
      }


      if (xOptions && xOptions["headerKeywordList"]) {
        //根据每个header，生成对应的筛选条件
        _.each(xOptions["headerKeywordList"], function (xKeyword, xHeader) {
          //把每个筛选条件增加到 filters.$and中
          _.each(zThis.methods.getFilterArrayByKeyword(xKeyword, "record." + xHeader), function (xxHeaderFilter) {
            zFilters["$and"].push(xxHeaderFilter)
          })
        })
      }


      // $and长度为0，去除 $and
      if (!zFilters["$and"].length) delete zFilters["$and"];


      // console.log("zFilters",JSON.stringify(zFilters));

      if (xOptions && xOptions.count) {
        zDB.count(zFilters, function (err, xNum) {
          try {
            var zReturnNum = xNum;
            if (err) zErr = err;
            if (xNum >= zMaxLimitNum) {
              zErr = "maxLimitNumExceed";
              zReturnNum = zMaxLimitNum;
            }
            if (_.isFunction(xCallBack)) xCallBack(zErr, zReturnNum)
          } catch (err) {
            console.log(err)
          }
        })
      }
      else {

        var zProjections = xOptions["projections"] ? xOptions["projections"] : {};

        // console.log("zProjections",zProjections)

        var zCursor = zDB.find(zFilters, zProjections);
        if (xOptions.sort) zCursor = zCursor.sort(xOptions.sort);
        if (xOptions.skip) zCursor = zCursor.skip(xOptions.skip);
        if (xOptions.limit) zCursor = zCursor.limit(xOptions.limit);
        if(!xOptions.limit){
          zCursor= zCursor.limit(zMaxLimitNum);
        }

        zCursor.exec(function (err, xDocs) {
          try {
            if (err) zErr = err;
            // if(xDocs.length==zMaxLimitNum)zErr="maxLimitNumExceed";


            if (_.isFunction(xCallBack)) xCallBack(zErr, xDocs)

          } catch (err) {
            console.log(err)
          }
        });
      }


    },
    /*
     根据 原始的关键字（非列头关键字），按规则，生成 filters，增加到原filters中

     xKeyword，关键字，"xxx|yyy^zzz"
     [,xSourceFilters],原filters

     */
    setFiltersBySourceKeyword: function (xKeyword, xDBType, xSourceFilters) {
      var zFilters = xSourceFilters;

      //如果 查询text 的文本，全部作为 并集查询
      if (xDBType == "text") {
        xKeyword = xKeyword.replace(/\^/g, "|")
      }

      if (!zFilters["$and"]) zFilters["$and"] = [];

      //从映射表中 获取此数据库中，数据存放在那个字段

      _.each(zThis.settings.extMappingList[xDBType]["field"], function (xField) {
        //筛选条件的 $and 中 增加 keyword生成的筛选条件
        _.each(zThis.methods.getFilterArrayByKeyword(xKeyword, xField), function (xFilterObj) {
          zFilters["$and"].push(xFilterObj)
        })

      });

    },

    //把 keyword 处理成 筛选条件数组
    // xKeyword:"aa|bb^cc" 带条件的关键字
    // xField:"row"/"record.价格"/... ,此关键字筛选的条件
    //return : [""]
    getFilterArrayByKeyword: function (xKeyword, xField) {

      // 若有空格，把空格 替换成 |
      xKeyword = xKeyword.replace(/(\s)+/g, "|");

      var z$And = [];

      // 把 keyword 按 ^ 分割
      var zSplitArray = xKeyword.split("^");

      //循环每个交集
      _.each(zSplitArray, function (xTagsString, xIndex) {
        // 按 | 分割
        var zWords = xTagsString.split("|");
        //console.log("zTagNames",zTagNames)
        var z$or = [];
        //循环 每个 交集中的 并集
        _.each(zWords, function (xxWord) {
          if (!xxWord)return;
          var zWord = xxWord;

          z$or.push({[xField]: {$regex: new RegExp(zWord, "i")}});

        });

        z$And.push({$or: z$or});

      });

      return z$And
    }


  };


  this.start = zThis.methods.start;
  this.setupAndLoadDBs = zThis.methods.setupAndLoadDBs;
  this.close = zThis.methods.close;
  this.queryDBData = zThis.methods.queryDBData;

};


// 设置静态变量， 可修改的设定参数
FileCache.settings = settings;


module.exports = FileCache;