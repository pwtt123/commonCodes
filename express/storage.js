/**
 * Created by SE02 on 2017/7/27.
 */
var express = require('express');
var router = express.Router();
var _=require('underscore');
var session = require('express-session');
var settings=require('./settings');
var path = require('path');
var fs=require('fs');
var moment = require('moment');
var url = require('url');

module.exports={
    //传入userPage之后的路径，返回此目录下的txt内容,图片url以及文件名，创建日期，是够文件夹等信息,文件夹对象（递归此函数），
//xDirPath:变量定义的路径  //e.g.:"settings._PATH_USER_PAGE "
//xRecordID:xDirPath下的路径:"pwt" 、"pwt/表現"
//xCallback.xResultDataObject // todo: {"xxx.txt":{value:"文本内容","isDirectory":false,"cTime":"2017-07-31T02:41:46.694Z","fileName":"xxx.txt"},"yyy.jpg":{value:"userPage/pwt/yyy.jpg","isDirectory":false,"cTime":"2017-07-31T02:41:46.694Z","fileName":"yyy.jpg","表现":{fileName:"表现","isDirectory":true，"cTime":"2017-07-31T02:41:46.694Z",value:{"表现1.txt":{}}},"成绩":{..}...}
    loadUserDirData:function (xDirPath,xRecordID,xCallback,xFilterCallback){
        var zResObject={};
        var zNum4FilesLoaded=0;
        // 计数器全部处理完，callback
        // 读取xRecordID下的所有文件及文件夹

        fs.readdir(xDirPath + xRecordID,function (err, xRecordIDFileArray) {
            //console.log(xRecordIDFileArray);
            if (_.isEmpty(xRecordIDFileArray)) {
                xCallback(err,zResObject);
                return;
            }
            var zDirPathFileArray = xRecordIDFileArray;
            //判断是否有筛选函数，有的话执行
            if (_.isFunction(xFilterCallback)) zDirPathFileArray = _.filter(xRecordIDFileArray, xFilterCallback);
            var zDirPathFileArrayLength = zDirPathFileArray.length;
            //console.log(zDirPathFileArray);
            //筛选后为空的话，返回空对象
            if (_.isEmpty(zDirPathFileArray)) {
                xCallback(err,zResObject);
                return;
            }
            //遍历所有文件
            _.each(zDirPathFileArray, function (xRecordIDFileString) {
                    fs.stat(xDirPath + path.join(xRecordID, xRecordIDFileString), function (err, stat) {
                        //没有错误，并且stat存在的话，判断文件类型
                        if (!err && stat) {
                            //console.log(stat.ctime);
                            // 如果是文件夹，递归此函数，存返回的对象
                            if (stat.isDirectory()) {
                                //console.log(xRecordID+"/"+xRecordIDFileString);
                                module.exports.loadUserDirData(xDirPath,path.join(xRecordID, xRecordIDFileString), function (err,data) {
                                    //console.log(data);
                                    if(err){ xCallback(err,"");return;}
                                    try{

                                        zResObject[xRecordIDFileString] = {"cTime":stat.ctime,"value":data,"isDirectory":true,"fileName":xRecordIDFileString};
                                        //console.log(zResObject[xRecordIDFileString]);
                                        zNum4FilesLoaded++;
                                        RunCallbackIfAllFilesLoaded();
                                    }catch(err){
                                        xCallback(err,"")
                                    }

                                });

                            }
                            // 如果是txt，存内容
                            else if (xRecordIDFileString.toLowerCase().endsWith(".txt")) {
                                fs.readFile(xDirPath + path.join(xRecordID, xRecordIDFileString), 'utf8', function (err, data) {
                                    if(err){ xCallback(err,"");return}
                                    try{zResObject[xRecordIDFileString] = {"cTime":stat.ctime,"value":data,"isDirectory":false,"fileName":xRecordIDFileString};
                                        zNum4FilesLoaded++;
                                        RunCallbackIfAllFilesLoaded()
                                    }catch (err){
                                        xCallback(err,"")
                                    }

                                });
                            }
                            // 如果是图片，存地址
                            else   if (xRecordIDFileString.toLowerCase().endsWith(".gif")|| xRecordIDFileString.toLowerCase().endsWith(".jpg") || xRecordIDFileString.toLowerCase().endsWith(".png") || xRecordIDFileString.toLowerCase().endsWith(".jpeg")) {
                                try{
                                    zResObject[xRecordIDFileString] = {"cTime":stat.ctime,"value":"../"+path.basename(xDirPath)+"/"+xRecordID.replace(/[\\]/g,"/")+"/"+xRecordIDFileString,"isDirectory":false,"fileName":xRecordIDFileString};
                                    //console.log( path.basename(xDirPath)+"/"+xRecordID.replace("\\","/")+"/"+xRecordIDFileString);
                                    zNum4FilesLoaded++;
                                    RunCallbackIfAllFilesLoaded()
                                }catch(err){
                                    xCallback(err,"")
                                }

                            }
                            //如果是json文件，存放json对象
                            else if(xRecordIDFileString.toLowerCase().endsWith(".json")){
                                module.exports.loadJSONData({collectionID:"comments",fileName:xRecordIDFileString},function(err,data){
                                    if(err){xCallback(err,"");return;}
                                    try{

                                        zResObject[xRecordIDFileString] ={"cTime":stat.ctime,"value":data,"isDirectory":false,"fileName":xRecordIDFileString};
                                        zNum4FilesLoaded++;
                                        RunCallbackIfAllFilesLoaded()
                                    }catch (err){
                                        xCallback(err,"")
                                    }
                                });
                            }
                            //如果都不是以上类型，跳过
                            else {
                                zNum4FilesLoaded++;
                                RunCallbackIfAllFilesLoaded();
                            }
                        }
                        //如果有错误，跳过
                        else {
                            zNum4FilesLoaded++;
                            RunCallbackIfAllFilesLoaded();
                            console.error(err);
                        }
                    });
            });
            //当所有文件读取完，执行callback
            function RunCallbackIfAllFilesLoaded() {
                if (zNum4FilesLoaded == zDirPathFileArrayLength) {
                    //console.log("RunCallbackIfAllFilesLoaded",zResObject);
                    xCallback(null,zResObject)
                }
            }
        });
    },

    // save a file under PATH with given output Object  在指定路径下保存json文件
// e.g. \DATA_ROOT\comments\pwt#201707271059119.json
// xOptions:{
//  collectionID:"xxx"            // e.g. "comments"
//  recordID:"xxx"                  // e.g. "pwt"
//  isUpdateDateRecorded:1/0    // e.g. 1. recorded / 0. default not recorded
// }
// xOutputObject：写入JSON文件的内容对象
// xCallback：出错会返回err
    saveJSONData:function(xOutputObject,xOptions,xCallback){
    //初始化赋值
    //    console.log("aa");
        try {
    var zFileName="";
    var zWriteValueString=JSON.stringify(xOutputObject);
    //当isUpdateDateRecorded为1，文件名：pwt#一段日期数字.json，为0 pwt.json
    if(xOptions["isUpdateDateRecorded"]===1){
        zFileName=xOptions["recordID"]+"#"+moment().format("YYYYMMDDHHmmssSSS")+".json";
        //console.log(zFileName)
    }else if(xOptions["isUpdateDateRecorded"]===0){
        zFileName=xOptions["recordID"]+".json";
        //console.log(zFileName)
    }else{
        xCallback(err);return;
    }
        //写入文件
    fs.writeFile(path.join(settings._PATH_DATA_ROOT,xOptions["collectionID"],zFileName),zWriteValueString,function(err){
        try{
       xCallback(err)
        }catch(err){
            console.log(err);
            xCallback(err)
        }
    })
        }catch(err){
            xCallback(err)
        }
},

    //获取_PATH_DATA_ROOT/collectionID下的fileName 的json文件，返回内容对象
//xOptions:{
//  collectionID:"xxx"            // e.g. "comments"
//  fileName:"xxx"                // e.g. "pwt"//
// }
    loadJSONData:function(xOptions,xCallback){
    fs.readFile(settings._PATH_DATA_ROOT+path.join(xOptions["collectionID"], xOptions["fileName"]), 'utf8', function (err, data) {
        try{
            var zObjectStringStartPos=0;

            var zDataString=data?data:"";

            zObjectStringStartPos=zDataString.indexOf("{");
            if (zObjectStringStartPos>0) {
                zDataString=zDataString.substring(zObjectStringStartPos);
            }

            //console.log("zDataString",zDataString)
            var zResObject=JSON.parse(zDataString);
            //console.log("zResObject",zResObject)

            xCallback(err, zResObject);
        }catch(err){
            console.log("err",err);
            xCallback(err,"")
        }

    })
}

};
