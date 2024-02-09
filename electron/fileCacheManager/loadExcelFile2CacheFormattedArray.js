

var fs=require("fs");
var _= require("underscore");
var path = require('path');
var XLSX = require('xlsx');
/*
 读取excel文件，处理成缓存的格式
 把excel,按sheet分割，再分别按行分割，每一行的内容作为 数据库一条记录

 xFilePath，excel的文件路径
 xFileObj，文件的 相关信息{mtime:date,..}
 xCallBack（err,xCacheFormattedArray）回调函数
 err,错误信息
 xCacheFormattedArray,此excel文件的处理后的 记录集合
 */
//todo 合并单元格的处理, 有列头的情况，处理成 key,value 对

var loadExcelFile2CacheFormattedArray=function (xFilePath,xFileObj,xOptions,xCallBack) {

  var time1=new Date();

  var zThis = this;
  //返回结果数组
  var zResultArray = [];
  //console.log("loadExcel",xFileObj)
  if(!xFileObj || !xFileObj["mtime"])console.log("excelMtimeNotFound");

  //后缀名 判断是否 是xlsx,xls文件，不是返回错误
  var zSuffixName = xFilePath.substr(xFilePath.lastIndexOf(".") + 1).toLowerCase();
  if (zSuffixName != "xlsx" && zSuffixName != "xls")return xCallBack("suffixNameIllegal");


  // fs 异步读取文件
  fs.readFile(xFilePath, function (err, xFileData) {

    try {
      if(err && _.isFunction(xCallBack))return xCallBack(err);


      // 用 xlsx 组件 处理数据
      //cellDates：true,时间格式转换
      var workbook = XLSX.read(xFileData, {type: 'buffer', cellDates: true});
      var time2=new Date();

      // console.log("workbook",time2-time1)
      // console.log("workbook",workbook)




      //处理每个 sheet
      _.each(workbook["Sheets"], function (xSheetObj, xSheetName) {
        // 若当前 sheet 不存在有效 单元格数据，则返回
        if (!xSheetObj["!ref"])return;

        // var zLinks=[];
        // //循环每个单元格, 若有链接,保存链接格式
        // _.each(xSheetObj,function (xCellObj,xCellIndex) {
        //   if(xCellObj["l"]){
        //
        //     // zLinks.push({[xCellIndex]})
        //   }
        // });
        
        
        // 合并单元格的信息
        var zMerges=xSheetObj["!merges"];

        //处理一个sheet的数据
        //header: 1，把 数据处理成 [["A1","B1"],["A2","B2"]]的形式，
        //raw:true，使用单元格本身的格式，数字，时间等
        //blankrows：false,忽略空行
        var zJSONArray = XLSX.utils.sheet_to_json(xSheetObj, {
          header: 1,
          raw: true,
          blankrows: true
        });
        var time3=new Date();
        // console.log("sheet_to_json",time3-time2)
        // console.log("zJSONArray",zJSONArray)

        //如果存在合并单元格，把数据填充完整
        if(zMerges){

          var zMaxCellNum2FillMerges=xOptions["maxCellNum2FillMerges"];

          //处理每个 合并单元格
          _.each(zMerges,function (xMerge) {
            if(!xMerge.s || !xMerge.e)return;
            var zCellNum=(xMerge.e.r-xMerge.s.r+1)*(xMerge.e.c-xMerge.s.c+1);

            // console.log("zCellNum",zCellNum)
            // console.log("zMaxCellNum2FillMerges",zMaxCellNum2FillMerges)
            if(zMaxCellNum2FillMerges &&  zCellNum>zMaxCellNum2FillMerges) return console.log("MergesCellNumExceed");

            // 填充 每个合并的单元格
            fillMergesValueToSheetJSON(xMerge.s,xMerge.e,zJSONArray)
          })
        }
        
        var time4=new Date();
        // console.log("fill",time4-time3)
      

        // 列头标志
        var zHeaderMarkString;

        //列尾标志
        var zFooterMarkString;
        
        if(xOptions["excelHeaderMark"]) zHeaderMarkString=xOptions["excelHeaderMark"];
        if(xOptions["excelFooterMark"]) zFooterMarkString=xOptions["excelFooterMark"];
        

        // console.log("zHeaderMarkString",zHeaderMarkString)
        // console.log("zFooterMarkString",zFooterMarkString)

        
        // 每一张table的标题数组
        var zTableHeaderArray=[];
        //每一张表的 列头 的 标记符号列
        var zTableHeaderMarkRow=-1;
      

        // 是否忽略此 行，若检测到 列尾，则此标志设为true,检测到列头 再设为 false
        var ifIgnore=false;


        // 处理每行数据，转换成 需要的 缓存数据对象，放到结果数组中
        _.each(zJSONArray, function (xxRowArray, xRowIndex) {
          // 此列是否 不要保存
          var zIgnored=ifIgnore;

          //此行的 列头数组（此行 若存在 列头标记，列头的改动不影响此行本身的列头）
          var zHeaderArray=_.clone(zTableHeaderArray);

          //需要储存的内容数组
          var zContentRow=[];
          
          // 列尾标记 所在列 下标，不存在代表 此单元格 不是在 此行的 列尾标记之后
          var zThisFooterMarkRow;
          var zThisHeaderMarkRow;

          // 此行数据是否有效，若直到保存 此行数据时，此标志依然为false,代表全是空字符串，不进行保存
          var zIfAvailable=false;

          //循环每个单元格
          _.each(xxRowArray,function (xCell,xxColIndex) {
            //此单元格 是否 为空
            var zIsCellNull=true;

            //0,执行顺序，顺序不可打乱
            //若 此单元格为undefined或null ，则转为空字符串
            if(xCell==undefined){
              xCell="";
            }else{
              zIsCellNull=false;
            }


            // console.log("zFooterMarkString2",zFooterMarkString)

            // if(xCell.indexOf("$$footer")==-1)console.log("zzz",xCell)

            //1
            //若 此单元格是 列尾标记，
            if(zFooterMarkString && typeof(xCell)=="string" && xCell.replace(/\s/g,"")==zFooterMarkString){
              // console.log("cc")
              //记录下 标记 列的下标
              zThisFooterMarkRow=true;
              // 之后的列的数据 视为列尾，不储存，并且 忽视标志设为 true
              ifIgnore=true
            }


            // 2
            //在此行列头标记之后的 数据，存放在列头数组中，并且列头标记不 放入，
            if(zThisHeaderMarkRow){
              // console.log("aa");
              zTableHeaderArray.push(xCell)
            }

            //3
            // 若 此单元格为 列头标志 ，之后的列都视为列头
            if(zHeaderMarkString && typeof(xCell)=="string" && xCell.replace(/\s/g,"")==zHeaderMarkString){

              // console.log("bb",xCell,xxColIndex);


              // console.log("header",xCell)
              // 下一列数据需要保存
              ifIgnore=false;
              // 清空现有列头
              zTableHeaderArray=[];

              //记录下此行的列头标记 下标
              zThisHeaderMarkRow=true;

              //有效列下表改变
              zTableHeaderMarkRow=xxColIndex;

            }


            //4
            // 当 列号 大于 此表的列头标志的列号,并且不是在 列尾 及 列头 标记之后 才会存放到内容 中
            if(xxColIndex>zTableHeaderMarkRow && !zThisFooterMarkRow && !zThisHeaderMarkRow){


              //若 保存时 有一格不为空，则此行数据 有效
              if(!zIsCellNull)zIfAvailable=true;
              zContentRow.push(xCell);
            }

            
          });

          //5
          //不保存此行
          if(zIgnored || !zContentRow.length || !zIfAvailable)return;

          //若 此行 存在 列头 或列尾标记，返回
          if(zThisFooterMarkRow || zThisHeaderMarkRow)return;

          //console.log("xxRowArray", xxRowArray);

          //初始化 缓存数据对象
          var zResultRowObj = {
            fullPath:xFilePath,
            sheetName: xSheetName,
            mtime: xFileObj["mtime"],
            row: zContentRow,
            index:xRowIndex
          };


          // console.log("zHeaderArray",zHeaderArray)
          // console.log("zTableHeaderArray",zTableHeaderArray)

          if(zHeaderArray.length){
            // console.log("header",zHeaderArray.join(","));
            zResultRowObj["header"]=zHeaderArray.join(",");

            var zRecord={};
            // 把 列名：内容 key value对存放到 record字段
            _.each(zHeaderArray,function (xHeader,xIndex) {
              zRecord[xHeader]=zContentRow[xIndex]
            });
            zResultRowObj["record"]=zRecord;
          }


          zResultArray.push(zResultRowObj)
        });
      });


      // console.log("zResultArray",zResultArray)

      if (_.isFunction(xCallBack)) xCallBack(null, zResultArray);


    } catch (err) {
      if (_.isFunction(xCallBack))return xCallBack(err)
    }
  });



};






// 从 转为JSON 数组格式的 sheet中 取得 对应 行列的 数据
function getValueFromSheetJSON(xRow,xCol,xSheetJSON) {

  // console.log("xRow",xSheetJSON)

  if(!xSheetJSON[xRow])xSheetJSON[xRow]=[];

  return  xSheetJSON[xRow][xCol];
}

// 把数据 增加到 JSON 数组格式的 sheet 的 对应行列 中
function setValue2SheetJSON(xRow,xCol,xValue,xSheetJSON) {
  if(!xSheetJSON[xRow]) xSheetJSON[xRow]=[];
  xSheetJSON[xRow][xCol]=xValue;
}

/* 填充 合并单元格的 数据
 end:{  单元格结束 信息
 c:0 行 下标
 r:2 列 下标
 }
 start:{ 单元格起始 信息
  c:0
  r:0
  }
*/
function fillMergesValueToSheetJSON(start,end,xSheetJSON) {


  // console.log("start",start)
  // console.log("end",end)
  // 获取 合并单元格 的数据
  var zValue=getValueFromSheetJSON(start.r,start.c,xSheetJSON);
  // console.log("zValue",zValue)
  // 循环合并的所有 单元格，填充数据
  for(var i=start.r;i<=end.r;i++){
    for(var j=start.c;j<=end.c;j++){
      // 跳过 第一行第一列
      if(i==start.r && j==start.c) continue;
      setValue2SheetJSON(i,j,zValue,xSheetJSON)
    }
  }
}


module.exports = loadExcelFile2CacheFormattedArray;

