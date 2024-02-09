var express = require('express');
var router = express.Router();
var _=require('underscore');
var session = require('express-session');
var settings=require('../settings');
var publicPath=settings._URL_PUBLIC;
var path = require('path');
var accessCheck=require('../accessCheck');
var zInterface=require('../interface');
var _ERR=settings._ERR;


//userID或pwd为空，返回错误：不能为空，通过传入的userID，查找accounts下的JSON文件,不存在,写入新的JSON文件，
// 若存在，判断pwd和JSON文件中的pwd是否一致，不一致返回错误：帐号已存在，
//若一致，且pwd2不为空，修改JSON文件的信息
router.post(publicPath+'createUserGroup.do', function (req, res, next) {
    try{
        var zTemp={};


        //只能admin有权访问
        if (!accessCheck.checkCurrentUserRoles(req,res,["admin"])) return;





        zTemp["原数据"]= _.pick(req.body,"name","type","groupInfo","memo");


        //外部接口使用数据
        zTemp["xInput的数据"]={};

        _.each(zTemp["原数据"],function(xValue,xIndex){

            if(xIndex=="groupInfo"|| xIndex=="type" ){
                zTemp["xInput的数据"][xIndex]=JSON.parse(xValue);
                return;
            }
            zTemp["xInput的数据"][xIndex]=xValue;
        });



        //若配置文件register存在，引入外部register.js
        if(settings.interfaces.createUserGroup){

            //调用外部接口
            zInterface.execExternalInterface(
                settings.interfaces.createUserGroup,
                zTemp["xInput的数据"],
                null,
                function(err,data){
                    zInterface.runCommonCallback(err,data,res)
                });

        }
        //外部接口不存在
        else {
            settings.handle("interfaceNotFound",res);
        }


    }catch(err){
        return settings.handle(err,res);
    }

});


module.exports = router;
