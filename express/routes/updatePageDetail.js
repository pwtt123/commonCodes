var express = require('express');
var router = express.Router();
var _=require('underscore');
var session = require('express-session');
var settings=require('../settings');
var publicPath=settings._URL_PUBLIC;
var accessCheck=require('../accessCheck');
var zInterface=require('../interface');
var _ERR=settings._ERR;

//  更新 组件明细 记录
router.post(publicPath+'updatePageDetail.do', function (req, res, next) {
    try{
        var zTemp={};
        var zOptions={};
        var zTargetUserIDs;

        if(req.body.options) zOptions=JSON.parse(req.body.options);
        if(req.body.userID) zTargetUserIDs=[req.body.userID];

        //只能op和admin访问
        if (!accessCheck.checkCurrentUserRoles(req,res,["op","admin"])) return;

        //只有 admin 有权 修改 模版明细 记录
        if (zOptions["isTemplate"]) {
            if(!accessCheck.checkCurrentUserRoles(req,res,["admin"])) return;
        }
        //只有 op 有权 修改 对客展示明细 记录
        if (!zOptions["isTemplate"]) {
            //修改对客展示明细 记录时 必须传userID
            if(!zTargetUserIDs)return  settings.handle("userIDNotInputted",res);
            if(!accessCheck.checkCurrentUserRoles(req, res, ["op"]))return;
        }

        //若创建 对客展示表 到 某个 userID ，检查是否 在 可访问列表中
        if(zTargetUserIDs){
            if(!accessCheck.checkTargetUserIDs(req,res,zTargetUserIDs))return;
        }

        //筛选传入的数据
        zTemp["原数据"]= _.pick(req.body,"userID","pageID","pageDetailID","navItemID","indent","compoHTMLTag",
            "orderID","isExpanded","compoProps","optionGroupName");

        zTemp["xInput数据"]={};

        //调用exec的 xInput 数据
        _.each(zTemp["原数据"],function(xValue,xIndex){
            if(xIndex=="compoProps") {zTemp["xInput数据"][xIndex]=JSON.parse(xValue);return;}
            zTemp["xInput数据"][xIndex]=xValue
        });



        zTemp["xOptions数据"]= _.pick(zOptions,"isTemplate");


        //配置文件地址存在
        if(settings.interfaces.updatePageDetail){
            try{

                //调用外部接口
                zInterface.execExternalInterface(
                    settings.interfaces.updatePageDetail,
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
