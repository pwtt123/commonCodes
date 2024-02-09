var express = require('express');
var router = express.Router();
var _=require('underscore');
var session = require('express-session');
var settings=require('../settings');
var publicPath=settings._URL_PUBLIC;
var accessCheck=require('../accessCheck');
var zInterface=require('../interface');
var _ERR=settings._ERR;

//  获取 对客展示页 记录 及其 组件明细记录
router.post(publicPath+'readPage.do', function (req, res, next) {
    try{
        var zTemp={};
        var zTargetUserIDs;
        var zOptions={};
        var zTargetGroupIDs;

        if(req.body.options) zOptions=JSON.parse(req.body.options);
        if(req.body.userID) zTargetUserIDs=[req.body.userID];
        if(req.body.userGroupID) zTargetGroupIDs=[req.body.userGroupID];



        //op，user，和admin可以访问
        if (!accessCheck.checkCurrentUserRoles(req,res,["op","user","admin"])) return;

        // admin,op 有权 读取 模版 记录
        if (zOptions["isTemplate"]) {
            if(!accessCheck.checkCurrentUserRoles(req,res,["admin","op"])) return;
        }
        //只有 user,op 有权 读取 对客展示 记录
        if (!zOptions["isTemplate"]) {
            if(!accessCheck.checkCurrentUserRoles(req, res, ["user","op"]))return;
        }

        //若读取所有模版信息，只有管理员可以
        if(!zTargetUserIDs && !zTargetGroupIDs){
            if(!accessCheck.checkCurrentUserRoles(req,res,["admin"])) return;
        }

        //若读取某个 userID的 评论 ，检查是否 在 可访问列表中
        if(zTargetUserIDs){
            if(!accessCheck.checkTargetUserIDs(req,res,zTargetUserIDs))return;
        }

        //若读取 某个 userGroupID 的可使用模版 ，检查是否 在 分组组合中
        if(zTargetGroupIDs){
            if(!accessCheck.checkTragetGroupIDs(req,res,zTargetGroupIDs))return;
        }










        //筛选传入的数据
        zTemp["原数据"]= _.pick(req.body,"pageID","userID","userGroupID");

        zTemp["xInput数据"]={};


        //调用exec的 xInput 数据
        _.each(zTemp["原数据"],function(xValue,xIndex){
            if(xIndex=="userGroupID"){zTemp["xInput数据"]["userGroupIDs"]=[xValue];return;}
            zTemp["xInput数据"][xIndex]=xValue
        });


        zTemp["xOptions数据"]= _.pick(zOptions,"isTemplate");


        //配置文件地址存在
        if(settings.interfaces.readPage){
            try{

                //调用外部接口
                zInterface.execExternalInterface(
                    settings.interfaces.readPage,
                    zTemp["xInput数据"],
                    zTemp["xOptions数据"],
                    function(err,data){
                        zInterface.runCommonCallback(err,data,res)
                    });


            }
            catch(err){
                return settings.handle(err,res)
            }

        }
        //配置文件地址不存在
        else{
            settings.handle("interfaceNotFound",res);
        }



    }catch(err){
        return settings.handle(err,res)
    }
});








module.exports = router;
