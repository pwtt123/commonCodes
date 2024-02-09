/**
 * Created by SE02 on 2017/7/27.
 */
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

var checkID=/^[0-9a-zA-Z_#@-]{2,36}$/;
var checkPwd=/^[0-9a-zA-Z_#@-]{2,19}$/;
//userID或pwd为空，返回错误：不能为空，通过传入的userID，查找accounts下的JSON文件,不存在,写入新的JSON文件，
// 若存在，判断pwd和JSON文件中的pwd是否一致，不一致返回错误：帐号已存在，
//若一致，且pwd2不为空，修改JSON文件的信息
router.post(publicPath+'register.do', function (req, res, next) {
    try{
        var zTemp={};
        var zOptions={};
        var zTargetUserIDs;

        if(req.body.options) zOptions=JSON.parse(req.body.options);
        if(req.body.userID) zTargetUserIDs=[req.body.userID];

        //只能op有权访问
        if (!accessCheck.checkCurrentUserRoles(req,res,["op"])) return;

        //修改时，只能修改 可访问列表中的用户信息
        if (zOptions["isUpdate"]) {
            if(zTargetUserIDs){
                if(!accessCheck.checkTargetUserIDs(req,res,zTargetUserIDs))return;
            }
        }



        //判断userID和密码是否为空
        if(!req.body.userID){return settings.handle("userIDIsNull",res)}
        if(!zOptions["isUpdate"]){
            if(!req.body.pwd){return settings.handle("pwdIsNull",res) }
            if(req.body.pwd.length<=2 || req.body.pwd.length>=20 ){return settings.handle("pwdLengthError",res)}
        }else if(req.body.updatePwd){
            //console.log("updatePwd",req.body.updatePwd);
            //console.log("type", typeof (req.body.updatePwd));
            if(req.body.updatePwd.length<=2 || req.body.updatePwd.length>=20 ){return settings.handle("pwdLengthError",res)}
            if(!checkPwd.test(req.body.updatePwd)){ return settings.handle("pwdInvalid",res)}
        }
        if(req.body.userID.length<=2 || req.body.userID.length>=40 ){return settings.handle("userIDLengthError",res) }
        if(!checkID.test(req.body.userID)){return settings.handle("userIDInvalid",res) }
        if(!checkPwd.test(req.body.pwd)){ return settings.handle("pwdInvalid",res)}




        zTemp["原数据"]= _.pick(req.body,"userID","pwd","userName","userInfo","branchIDs","userGroupIDs","updatePwd","memo");


        //外部接口使用数据
        zTemp["register的xInput数据"]={};
        zTemp["update的xInput数据"]={};

        _.each(zTemp["原数据"],function(xValue,xIndex){

            if(xIndex=="userInfo"|| xIndex=="userGroupIDs" || xIndex=="branchIDs"){
                zTemp["register的xInput数据"][xIndex]=JSON.parse(xValue);
                zTemp["update的xInput数据"][xIndex]=JSON.parse(xValue);
                return;
            }
            zTemp["register的xInput数据"][xIndex]=xValue;
            zTemp["update的xInput数据"][xIndex]=xValue;
        });

        zTemp["xOptions数据"]={};
         if(req.body.options) zTemp["xOptions数据"]=JSON.parse(req.body.options);


        //如果是请求是注册
        if(!zTemp["xOptions数据"]["isUpdate"]){
           //若配置文件register存在，引入外部register.js
             if(settings.interfaces.register){

                 //调用外部接口
                 zInterface.execExternalInterface(
                     settings.interfaces.register,
                     zTemp["register的xInput数据"],
                     null,
                     function(err,data){
                         zInterface.runCommonCallback(err,data,res)
                     });



            }
             //外部接口不存在
             else {
                 settings.handle("interfaceNotFound",res);
             }
        }
        //如果请求是修改,
        else{
            //若配置文件register存在，调用外部update.js
            if(settings.interfaces.updateUser){

                //调用外部接口
                zInterface.execExternalInterface(
                    settings.interfaces.updateUser,
                    zTemp["update的xInput数据"],
                    null,
                    function(err,data){
                        zInterface.runCommonCallback(err,data,res)
                    });


                 //});
             }
            //外部接口不存在
            else {
                settings.handle("interfaceNotFound",res);
            }
         }



    }catch(err){
        return settings.handle(err,res);
    }

});


module.exports = router;