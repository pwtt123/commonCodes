/**
 * Created by SE02 on 2017/8/3.
 */
var express = require('express');
var fs = require('fs');
var path = require('path');
var  _= require('underscore');
var moment = require('moment');

var _PATH_DATA_ROOT = process.env._PATH_DATA_ROOT || ".\\dataRoot\\";
var _COUNT_TARGET = process.env._COUNT_TARGET || "logs";
var _PATH_SAVE_JS = process.env._PATH_SAVE_JS || ".\\";
var _PATH_IMPORTED_DIR = process.env._PATH_IMPORTED_DIR || ".\\importedLogs";
//传文件夹地址和文件名，读取文件的内容
function loadJSONFile(xPath,xFileName,xCallBack){
 fs.readFile(path.join(xPath,xFileName),"utf-8",function(err,xJSONData){
  try{
  xCallBack(err,xJSONData)
  }catch(err){
   console.log(err)
  }
 })
}
//传文件夹地址，读取文件夹下所有内容
//function readAllFile(xPath,xCallBack){
// fs.readdir(_PATH_DATA_ROOT + _COUNT_TARGET,function (err, xRecordIDFileArray) {
//  xCallBack(err, xRecordIDFileArray)
// })
//}



//读取文件夹下所有文件
fs.readdir(path.join(_PATH_DATA_ROOT,_COUNT_TARGET),function (err, xRecordIDFileArray) {
 var zTemp={};
 var returnObj={};
 //计数器，当全部读取完文件再执行
 var zCount=0;
//console.log("xRecordIDFileArray:",xRecordIDFileArray);
var zFileArrayLength=xRecordIDFileArray.length;

 //创建文件夹
try{
 fs.mkdirSync(_PATH_IMPORTED_DIR);
}catch(err){
 console.log("文件夹已存在")
}



 zTemp["写入JS文件内容"]="";
 zTemp["文件数"]=0;
 zTemp["移动文件数"]=0;
 zTemp["移动文件计数器"]=0;
 if(!xRecordIDFileArray.length) console.log("文件数:"+zTemp["文件数"])
//循环所有文件名
 _.each(xRecordIDFileArray,function(xFileString){
  //非json文件不处理
  if(!xFileString.toLowerCase().endsWith(".json")) {zCount++;zTemp["移动文件计数器"]++;return;}
  //console.log("userID",zTemp["userID"]);
  //console.log("time",zTemp["time"]);
  zTemp["文件数"]++;

  //读取文件信息
  loadJSONFile(path.join(_PATH_DATA_ROOT,_COUNT_TARGET),xFileString,function(err,xJSONData){
   zTemp["userID"]=xFileString.substring(0,xFileString.length-5).split("#")[0];
   zTemp["timeNumber"]=xFileString.substring(0,xFileString.length-5).split("#")[1]?xFileString.substring(0,xFileString.length-5).split("#")[1]:"";


   zTemp["value"]=JSON.parse(xJSONData);
   returnObj[xFileString]={"timeNumber": zTemp["timeNumber"],"value":zTemp["value"]};

   zTemp["此文件对象"]=zTemp["value"]
   zTemp["timeNumber"]?zTemp["此文件对象"]["timeNumber"]=zTemp["timeNumber"]:""
   zTemp["此文件对象"]["userID"]=zTemp["userID"]

   zTemp["写入JS文件内容"]+=JSON.stringify(zTemp["此文件对象"])
  //移动文件
   fs.rename(path.join(_PATH_DATA_ROOT,_COUNT_TARGET,xFileString),path.join(_PATH_IMPORTED_DIR,xFileString),function(err){
    try{
    zTemp["移动文件计数器"]++;
    if(err) {console.log(err);return;}
    zTemp["移动文件数"]++;
     //打印移动成功文件数
    if(zTemp["移动文件计数器"]==zFileArrayLength){
     console.log("成功移入文件数："+zTemp["移动文件数"])
    }

    }catch(err){
     console.log(err)
    }
   })


   zCount++;
   //全部回调完后
    if(zCount==zFileArrayLength){
    zTemp["userID分组"]= _.groupBy(returnObj,function(xObj,index){ return index.substring(0,index.length-5).split("#")[0]; });

    zTemp["用户数"]=_.reduce(zTemp["userID分组"], function (memo,xArray) {
     return memo+1 ;
    },0);

     //console.log(zTemp["userID的数量集合JSON"]);
     //console.log("{\"用户数\":"+zTemp["用户数"]+"}");
     //console.log(zTemp["写入JSON文件内容"]);

     //保存js文件
     fs.writeFile(path.join(_PATH_SAVE_JS,_COUNT_TARGET+"Data.js"),zTemp["写入JS文件内容"],function(err){
      try{
       if(err){console.log(err);return;}
        console.log("成功生成JS文件")

      }catch(err){
       console.log(err);
      }
     });

    console.log("现在统计"+_COUNT_TARGET+"的信息");
    console.log("用户数:"+zTemp["用户数"]);
    console.log("文件数:"+zTemp["文件数"]);

    //console.log(typeof (zTemp["userID分组"]["linda"][0]["value"]))
   }
//console.log(zTemp["value"])
  })

 })

});

