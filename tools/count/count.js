/**
 * Created by SE02 on 2017/8/3.
 */
var express = require('express');
var fs = require('fs');
var path = require('path');
var  _= require('underscore');
var moment = require('moment');

var _PATH_DATA_ROOT = process.env._PATH_DATA_ROOT || "C:\\pwt\\SVNprojects\\expressCMS\\test\\dataRoot\\";
var _COUNT_TARGET = process.env._COUNT_TARGET || "logs";
var _PATH_SAVE_JSON = process.env._PATH_SAVE_JSON || "C:\\pwt\\SVNprojects\\expressCMS\\test";
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
 var zCount=0;
//console.log("xRecordIDFileArray:",xRecordIDFileArray);
var zFileArrayLength=xRecordIDFileArray.length;

 _.each(xRecordIDFileArray,function(xFileString){

  //console.log("userID",zTemp["userID"]);
  //console.log("time",zTemp["time"]);

  loadJSONFile(path.join(_PATH_DATA_ROOT,_COUNT_TARGET),xFileString,function(err,xJSONData){
   zTemp["userID"]=xFileString.substring(0,xFileString.length-5).split("#")[0];
   zTemp["timeNumber"]=xFileString.substring(0,xFileString.length-5).split("#")[1]?xFileString.substring(0,xFileString.length-5).split("#")[1]:"";

   zTemp["value"]=JSON.parse(xJSONData);
   returnObj[xFileString]={"timeNumber": zTemp["timeNumber"],"value":zTemp["value"]};





   //console.log("returnObj",returnObj);
   //console.log("userID分组",zTemp["userID分组"]);

   zCount++;

    if(zCount==zFileArrayLength){
    zTemp["userID分组"]= _.groupBy(returnObj,function(xObj,index){ return index.substring(0,index.length-5).split("#")[0]; });

    zTemp["userID分组JSON"]=JSON.stringify( zTemp["userID分组"]);
    //console.log(zTemp["userID分组JSON"]);

    zTemp["userID的数量集合"]={};
    _.each(zTemp["userID分组"],function(xArray,index){
//console.log(index);
     zTemp["userID的数量集合"][index]= _.reduce(xArray, function (memo,xArray) {
      return memo+1 ;
     },0);
     //console.log( zTemp["userID的数量集合"][index]);
    });
    zTemp["用户数"]=_.reduce(zTemp["userID分组"], function (memo,xArray) {
     return memo+1 ;
    },0);
     console.log("————————");
    zTemp["userID的数量集合JSON"]=JSON.stringify(zTemp["userID的数量集合"]);
     //console.log(zTemp["userID的数量集合JSON"]);

     //console.log("{\"用户数\":"+zTemp["用户数"]+"}");

     zTemp["写入JSON文件内容"]="[{\"用户数\":"+zTemp["用户数"]+"},{\"用户的文件数集合\":"+zTemp["userID的数量集合JSON"]+
         "},{\"用户的文件内容集合\":"+ zTemp["userID分组JSON"]+"}]";
     //console.log(zTemp["写入JSON文件内容"]);
     fs.writeFile(path.join(_PATH_SAVE_JSON,"countData"+moment().format("YYYYMMDDHHmmssSSS")+".json"),zTemp["写入JSON文件内容"],function(err){
      try{
       if(err){console.log(err);return;}
        console.log("成功保存JSON文件")
      }catch(err){
       console.log(err);
      }
     });

    console.log("现在统计"+_COUNT_TARGET+"的信息");
    console.log("用户数");
    console.log(zTemp["用户数"]);
    console.log("用户的文件数集合");
    console.log(zTemp["userID的数量集合"]);
    console.log("用户的文件内容集合");
    console.log(zTemp["userID分组"]);

    //console.log(typeof (zTemp["userID分组"]["linda"][0]["value"]))
   }
//console.log(zTemp["value"])
  })

 })

});

