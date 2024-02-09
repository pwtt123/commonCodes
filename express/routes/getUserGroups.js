
var express = require('express');
var router = express.Router();
var _=require('underscore');
var session = require('express-session');
var settings=require('../settings');
var publicPath=settings._URL_PUBLIC;
var accessCheck=require('../accessCheck');
var zInterface=require('../interface');
var _ERR=settings._ERR;

var fs=require('fs');

//返回 可用户有权限的分组及分店信息
router.post(publicPath+'getUserGroups.do',function(req, res, next){
    var zTemp={};
    try{

        //op和admin 可以访问
        if (!accessCheck.checkCurrentUserRoles(req,res,["admin","op"])) return;




        zTemp["userData"]=[];
        zTemp["userObj"]=req.session.user;
        //console.log(zTemp["userObj"]);


        zTemp["xInput数据"]= _.pick(req.body,"reqGroupID");
        zTemp["xInput数据"]["userID"]=zTemp["userObj"]["userID"];


        //若配置文件存在，引入外部js
        if(settings.interfaces.getUserGroups){
            try{

                //调用外部接口
                zInterface.execExternalInterface(
                    settings.interfaces.getUserGroups,
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