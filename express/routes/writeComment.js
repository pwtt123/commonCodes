/**
 * Created by SE02 on 2017/7/26.
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




//传入userID和评论内容，后端获取userRole和时间，写入评论json文件
router.post(publicPath+'writeComment.do', function (req, res, next) {
    try{
        var zTemp={};
        var zTargetUserIDs;
        var zOptions={};

        if(req.body.options) zOptions=JSON.parse(req.body.options);
        if(req.body.userID) zTargetUserIDs=[req.body.userID];


        //只能op和user访问
        if (!accessCheck.checkCurrentUserRoles(req,res,["op","user"])) return;

        //若写入 某个 userID的 评论 ，检查是否 在 可访问列表中
        if(zTargetUserIDs){
            if(!accessCheck.checkTargetUserIDs(req,res,zTargetUserIDs))return;
        }




        if(!req.body.userID){return settings.handle("userIDNotInputted",res)}
        if(!req.body.comment){return settings.handle("commentIsNull",res);}
        if(!req.session.user.roles){return settings.handle("rolesNotFound",res);}
        zTemp["userID"]=req.body.userID;
        zTemp["角色"]=req.session.user.roles;

        // 过度协议，req.ip,如果是ip4会返回::ffff:192.168.1.102，去掉开头
        if(req.ip.startsWith("::ffff:")){
            zTemp["ip"]= req.ip.replace("::ffff:","");
        }else{
            zTemp["ip"]= req.ip;
        }
        //zTemp["评论"]={time:时间，value:内容}
        zTemp["评论时间"]=moment().format("YYYY-MM-DD HH:mm:ss");
        if(zTemp["角色"][0]=="op"){
            zTemp["评论"]={"isAdmin":true,"time": zTemp["评论时间"],"content":req.body.comment,"IP":zTemp["ip"]};
        }else if(zTemp["角色"][0]=="user"){
            zTemp["评论"]={"time": zTemp["评论时间"],"content":req.body.comment,"IP":zTemp["ip"]};
        }else{
            return settings.handle("rolesNotFound",res)
        }


        zTemp["评论"]["userID"]=zTemp["userID"];


        //若配置文件存在，引入外部js
        if(settings.interfaces.writeComment){
            try{

                //调用外部接口
                zInterface.execExternalInterface(
                    settings.interfaces.writeComment,
                    zTemp["评论"],
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