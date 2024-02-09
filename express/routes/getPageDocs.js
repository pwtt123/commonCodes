
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



//  获取 对客展示页 ID集合，
// user角色只能获取自己的对客展示页，
// op角色可以获取某个分店可使用的模版，以及某个用户的对客展示页，
// admin角色可以获取所有模版，
router.post(publicPath+'getPageDocs.do', function (req, res, next) {
    try{
        var zTemp={};
        var zOptions={};
        var zTargetUserIDs;
        var zTargetBranchIDs;

        //console.log("req.body",req.body)

        if(req.body.options) zOptions=JSON.parse(req.body.options);
        if(req.body.userID) zTargetUserIDs=[req.body.userID];
        if(req.body.branchID) zTargetBranchIDs=[req.body.branchID];

        //user,op和admin访问
        if (!accessCheck.checkCurrentUserRoles(req,res,["user","op","admin"])) return;

        //只有op, admin 有权 读取 模版记录
        if (zOptions["isTemplate"]) {
            if(!accessCheck.checkCurrentUserRoles(req,res,["op","admin"])) return;
        }
        //只有 user,op 有权 读取 对客展示 记录
        if (!zOptions["isTemplate"]) {
            if(!accessCheck.checkCurrentUserRoles(req, res, ["user","op"]))return;
        }

        //若读取 某个 userID的 对客展示页 ，检查是否 在 可访问列表中
        if(zTargetUserIDs){
            if(!accessCheck.checkTargetUserIDs(req,res,zTargetUserIDs))return;
        }

        //若读取 某个 branchID 的可使用模版 ，检查是否 在 分店组合中
        if(zTargetBranchIDs){
            if(!accessCheck.checkTargetBranchIDs(req,res,zTargetBranchIDs))return;
        }

        //若既没有传userID,也没有传branchID ,返回err
        if(!zTargetUserIDs && !zTargetBranchIDs){
            return  settings.handle("accessDenied",res);

        }




        //限制传入的数据
        zTemp["原数据"]= _.pick(req.body,"userID","branchID");

        //console.log("原数据",zTemp["原数据"])

        zTemp["xInput数据"]={};
        //调用exec的 xInput 数据
        _.each(zTemp["原数据"],function(xValue,xIndex){
            if(xIndex=="branchID")zTemp["xInput数据"]["branchIDs"]=[xValue];
            zTemp["xInput数据"][xIndex]=xValue
        });

        //xOptions数据
        zTemp["xOptions数据"]= _.pick(zOptions,"isTemplate","ifIncludeInactivePages");

        //配置文件地址存在
        if(settings.interfaces.getPageDocs){
            try{

                //调用外部接口
                zInterface.execExternalInterface(
                    settings.interfaces.getPageDocs,
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
