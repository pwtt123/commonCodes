
var loadFuncs={};
loadFuncs.loadTextFile2CacheFormattedArray=require("./loadTextFile2CacheFormattedArray");
loadFuncs.loadExcelFile2CacheFormattedArray=require("./loadExcelFile2CacheFormattedArray");

// 可修改的设定参数
var settings = {

  //后缀名映射表
  extMappingList:{
    "table": {
      exts:["xls","xlsx"],
      loadFunc:(filePath,fileObj,xOptions,xCallBack) => {
        loadFuncs.loadExcelFile2CacheFormattedArray(filePath,fileObj,xOptions,xCallBack);
      },
      DBType: "table",
      //存放数据的字段
      field:["row"]
    },
    "text":{
      exts:["txt","md"],
      loadFunc:(filePath,fileObj,xOptions,xCallBack) => {
        loadFuncs.loadTextFile2CacheFormattedArray(filePath,fileObj,xOptions,xCallBack);
      },
      DBType: "text",
      //存放数据的字段
      field:["content"]
    },

  },

  //定时 修改缓存事件 的时间间隔（ms）
  intervalTime2UpdateCache: 5 * 1000,

  //缓存数据库文件 最大size,超过将不会再 插入数据
  MAX_CACHE_FILE_SIZE:240*1024*1024,

  //每条缓存记录 content 存放的 文本片段截取的字符长度
  cacheContentLength:1000,
  // excel的列头标记
  excelHeaderMark:"$$header",
  // excel的列尾标记
  excelFooterMark:"$$footer",

  //合并单元格的最大上限  超过此上限的合并单元格 不进行 填充处理
  maxCellNum2FillMerges:1000*1000,
  // 数据库 加密 算法
  DBCryptoAlgorithm:"aes192",
  // 数据库 加密 密钥
  pwd4DB:"adfqwerfgq",
  //数据库 文件的前缀名, 数据库全名 为 此前缀+DBType+".db"
  DBFilePrefixName:"$$TGL.cache.",
  // 总的数据库文件夹 相对 与 资料库文件夹 的路径
  DBDirRelativePath:"./tagLyst.DB",
  //资料库的数据库 文件夹的后缀，全名为 资料库名+ 此后缀
  dataBoxDBDirSuffix:"_DB",

  // flag文件名
  IsFinderQueryOnlyFlagFileName:"$$TGL.isFinderQueryOnly.flag",

  //最大 查询记录数
  maxQueryLimitNum:50000



};

module.exports =settings;
