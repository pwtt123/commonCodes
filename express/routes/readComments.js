/**
 * Created by SE02 on 2017/7/25.
 */
var express = require('express');
var router = express.Router();
var _=require('underscore');
var session = require('express-session');
var path = require('path');
var settings=require('../settings');
var publicPath=settings._URL_PUBLIC;
var accessCheck=require('../accessCheck');
var zInterface=require('../interface');
var _ERR=settings._ERR;

//根据传入的userID 返回对应的评论内容
router.post(publicPath+'readComments.do', function (req, res, next) {
    try{

        var zTemp={};

        var zOptions={};
        var zTargetUserIDs;

        if(req.body.options) zOptions=JSON.parse(req.body.options);
        if(req.body.userID) zTargetUserIDs=[req.body.userID];


        //只能op和user访问
        if (!accessCheck.checkCurrentUserRoles(req,res,["op","user"])) return;

        //若读取 某个 userID的 评论 ，检查是否 在 可访问列表中
        if(zTargetUserIDs){
            if(!accessCheck.checkTargetUserIDs(req,res,zTargetUserIDs))return;
        }


        if(!req.body.userID){return settings.handle("userIDNotInputted",res)}

        zTemp["userID"]=req.body.userID;

        zTemp["xInput数据"]= _.pick(req.body,"userID","pageNum","pageRecsNum");
        if(!zTemp["xInput数据"]["pageNum"])zTemp["xInput数据"]["pageNum"]=1;
        if(!zTemp["xInput数据"]["pageRecsNum"])zTemp["xInput数据"]["pageRecsNum"]=50;

    //若配置文件存在，引入外部js
        if(settings.interfaces.readComments){
            try{

                //调用外部接口
                zInterface.execExternalInterface(
                    settings.interfaces.readComments,
                    zTemp["xInput数据"],
                    null,
                    function(err,data){
                        zInterface.runCommonCallback(err,data,res)
                    }
                );



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
