var fs=require("fs");
var _= require("underscore");
var decodeBuffer=require("../utils/decoding/decodeBuffer");

/*读取 文本文件，处理成缓存的格式
 每1000字作为一条缓存记录
 xFilePath，excel的文件路径
 xFileObj，文件的 相关信息{mtime:date,..}
 xOptions，相关参数{
 cacheContentLength，每个文本片段截取的长度
 }
 xCallBack（err,xCacheFormattedArray）回调函数
 err,错误信息
 xCacheFormattedArray,文本文件文件的处理后的 记录集合
 */
var loadTextFile2CacheFormattedArray = function (xFilePath, xFileObj,xOptions,xCallBack) {

  //返回结果数组
  var zResultArray = [];
  //console.log("loadExcel",xFileObj)
  if (!xFileObj || !xFileObj["mtime"]) console.log("textMtimeNotFound");


  //直接读取文本文件的内容
  fs.readFile(xFilePath, function (err, xBufferData) {
    try {
      if (err && _.isFunction(xCallBack))return xCallBack(err);

      // console.log("xBufferData",xBufferData)
      // console.log("编码",xBufferData[0],xBufferData[1])

      // 把buffer 解码成字符串
      var zDataStr=decodeBuffer(xBufferData);

      // console.log("zDataStr",zDataStr)

      var zCacheContentLength=1001;
      // console.log("xOptions",xOptions)
      if(xOptions && xOptions["cacheContentLength"])zCacheContentLength=xOptions["cacheContentLength"];

      // console.log("zCacheContentLength",zCacheContentLength);

      //当 剩余的文本数据 不为空时，取前1000字符串，放到一条缓存记录中，并删除原来的前1000字符
      while (zDataStr) {
        // console.log("while")
        // 待放到缓存的前1000字符传
        var zTopString = zDataStr.substr(0, zCacheContentLength);
        //去掉 原有的前 1000字符
        zDataStr = zDataStr.substr(zCacheContentLength);
        //每一条缓存的记录
        var zResultRowObj = {
          fullPath: xFilePath,
          mtime: xFileObj["mtime"],
          content: zTopString,
        };
        zResultArray.push(zResultRowObj)
      }

      // console.log("xCallBack",xCallBack)

      // 返回结果 缓存数组
      if (_.isFunction(xCallBack)) xCallBack(null, zResultArray);

    }
    catch (err) {
      if (err && _.isFunction(xCallBack))return xCallBack(err)
    }
  })

};

module.exports = loadTextFile2CacheFormattedArray;
