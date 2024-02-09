/**
 * Created by SE02 on 2017/9/15.
 */

var express = require('express');
var router = express.Router();
var _=require('underscore');
var session = require('express-session');
var settings=require('../settings');
var publicPath=settings._URL_PUBLIC;
var crypto =require('crypto');
var fs = require("fs");
var accessCheck=require('../accessCheck');
var zInterface=require('../interface');
var _ERR=settings._ERR;

try{

//  获取激活码，储存用户信息
    router.post(publicPath+'getActivationCode.do', function (req, res, next) {
        try{
            var zTemp={};



            //console.log("req",req.body);

            zTemp["xInput数据"]= {
                userInfo:req.body.userInfo,
                payInfo:req.body.payInfo
            };


            //配置文件地址存在
            if(settings.interfaces.getActivationCode){
                try{

                    //调用外部接口
                    zInterface.execExternalInterface(
                        settings.interfaces.getActivationCode,
                        zTemp["xInput数据"],
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



        }catch(err){
            return settings.handle(err,res)
        }
    });

}catch(err){console.log(err)}






module.exports = router;