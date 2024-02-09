/**
 * Created by SE02 on 2017/8/1.
 */
var express = require('express');
var router = express.Router();
var _=require('underscore');
var session = require('express-session');
var path = require('path');

var settings=require('../settings');
var moment = require('moment');
var publicPath=settings._URL_PUBLIC;
var accessCheck=require('../accessCheck');
var zInterface=require('../interface');
var _ERR=settings._ERR;



//传入userID,data,tag1,2,3,veb，后端获取ip和时间，写入json文件/导入数据库
router.post(publicPath+'writeLog.do', function (req, res, next) {
    var zTemp={};
    try{
        //op，user，admin可以访问
        if (!accessCheck.checkCurrentUserRoles(req,res,["op","user","admin"])) return;


        if(!req.body.userID){ return settings.handle("userIDNotInputted",res);}

        zTemp["userID"]=req.body.userID;
        //zTemp["评论"]={time:时间，value:内容}
        zTemp["发送Log时间"]=new Date();


       // 过度协议，req.ip,如果是ip4会返回::ffff:192.168.1.102，去掉开头
        if(req.ip.startsWith("::ffff:")){
            zTemp["ip"]= req.ip.replace("::ffff:","");
        }else{
            zTemp["ip"]= req.ip;
        }


        //console.log(zTemp["ip"]);
            zTemp["Log信息"]={"userID":zTemp["userID"],
                "time": zTemp["发送Log时间"],
                "data":req.body.data?req.body.data:"",
                "tag1":req.body.tag1?req.body.tag1:"",
                "tag2":req.body.tag2?req.body.tag2:"",
                "tag3":req.body.tag3?req.body.tag3:"",
                "verb":req.body.verb?req.body.verb:"",
                "IP":zTemp["ip"]};




        //配置文件地址 writeLog 存在，引入配置文件中的 writeLog 的地址，调用其中的writeLog方法，传入log数据
        if(settings.interfaces.writeLog){
            try{

                //调用外部接口
                zInterface.execExternalInterface(
                    settings.interfaces.writeLog,
                    zTemp["Log信息"],
                    null,
                    function(err,data){
                        zInterface.runCommonCallback(err,data,res)
                    });


            }
            catch(err){
                return settings.handle(err,res)
            }

        }
        //外部接口不存在
        else {
            settings.handle("interfaceNotFound",res);
        }

    }catch (err){
        return settings.handle(err,res)
    }
});



module.exports = router;