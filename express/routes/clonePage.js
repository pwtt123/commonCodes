
var express = require('express');
var router = express.Router();
var _=require('underscore');
var session = require('express-session');
var settings=require('../settings');
var publicPath=settings._URL_PUBLIC;
var accessCheck=require('../accessCheck');
var zInterface=require('../interface');
var _ERR=settings._ERR;

var Thenjs=require("Thenjs");



// 克隆一个 对客展示页 ，开关控制是否克隆模版，以及是否克隆到模版
router.post(publicPath+'clonePage.do', function (req, res, next) {
    try{
        var zTemp={};
        var zOptions={};
        var zTargetUserIDs;

         if(req.body.options) zOptions=JSON.parse(req.body.options);
         if(req.body.userID) zTargetUserIDs=[req.body.userID];

        //权限检查
        //只有op和admin 有权访问
        //console.log("ee")
        //console.log("sessionUser",req.session.user)

        //console.log("req.body",req.body)
        //
        //console.log("zOptions",zOptions)
        //console.log("zOptions",zOptions)

        //只能op和admin访问
        if (!accessCheck.checkCurrentUserRoles(req,res,["op","admin"])) return;

        //只有 admin 有权 复制到 模版 表
        if (zOptions["ifCloneAsTemplate"]) {
            if(!accessCheck.checkCurrentUserRoles(req,res,["admin"])) return;
        }
        //只有 op 有权 复制到对客展示表
        if (!zOptions["ifCloneAsTemplate"]) {
            //克隆到 对客展示 时 必须传userID
            if(!zTargetUserIDs)return settings.handle("userIDNotInputted",res);

            if(!accessCheck.checkCurrentUserRoles(req, res, ["op"]))return;
        }
        //只有 op 有权  复制 对客展示表
        if (!zOptions["isFromTemplate"]) {

            if(!accessCheck.checkCurrentUserRoles(req,res,["op"])) return;
        }

        //若复制 对客展示表 到 某个 userID ，检查是否 在 可访问列表中
        if(zTargetUserIDs){

            if(!accessCheck.checkTargetUserIDs(req,res,zTargetUserIDs))return;
        }



        //权限判断




        //限制传入的数据
        zTemp["原数据"]= _.pick(req.body,"userID","pageID");


        zTemp["xInput数据"]={};
        //调用exec的 xInput 数据
        _.each(zTemp["原数据"],function(xValue,xIndex){
            zTemp["xInput数据"][xIndex]=xValue
        });

        //xOptions数据
        zTemp["xOptions数据"]= _.pick(zOptions,"isFromTemplate","ifCloneAsTemplate");

        //console.log("xOptions数据",zTemp["xOptions数据"]);
        //配置文件地址存在
        if(settings.interfaces.clonePage){

            //调用外部接口
            zInterface.execExternalInterface(
                settings.interfaces.clonePage,
                zTemp["xInput数据"],
                zTemp["xOptions数据"],
                function(err,data){
                    zInterface.runCommonCallback(err,data,res)
                }
            );
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

