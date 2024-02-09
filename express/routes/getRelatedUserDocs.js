/**
 * Created by SE02 on 2017/7/25.
 */
var storage=require('../storage');
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
//session.role为老师，返回所有dir，role为家长，且dir存在，返回dir
router.post(publicPath+'getRelatedUserDocs.do',function(req, res, next){
    var zTemp={};
    try{

        var zOptions={};
        var zTargetUserIDs;

        if(req.body.reqUserID) zTargetUserIDs=[req.body.reqUserID];


        if(req.body.options) zOptions=JSON.parse(req.body.options);
        if(req.body.userID) zTargetUserIDs=[req.body.userID];

        //user,op和admin 可以访问
        if (!accessCheck.checkCurrentUserRoles(req,res,["user","op"])) return;


        //若查找某个userID的信息，此userID需在可访问用户列表中
        if(zTargetUserIDs){
            if(!accessCheck.checkTargetUserIDs(req,res,zTargetUserIDs))return;
        }



        zTemp["userData"]=[];
        zTemp["userObj"]=req.session.user;
        //console.log(zTemp["userObj"]);

            //若 reqUserID存在，查询
         //if(req.body["reqUserID"]){
         //    zTemp["xInput数据"]={userID:req.body["reqUserID"]};
         //    zTemp["xOptions数据"]={ifGetUserDocsOnly:1};
         //
         //} else{
         //    zTemp["xInput数据"]={userID:zTemp["userObj"]["userID"]};
         //
         //}

        zTemp["xInput数据"]= _.pick(req.body,"reqUserID");
        zTemp["xInput数据"]["userID"]=zTemp["userObj"]["userID"];



        //若配置文件存在，引入外部js
        if(settings.interfaces.getRelatedUserDocs){
            try{

                //调用外部接口
                zInterface.execExternalInterface(
                    settings.interfaces.getRelatedUserDocs,
                    zTemp["xInput数据"],
                    null,
                    function(err,data){
                        //若reqUserID不存在， userID列表 保存到 session
                        if(!req.body["reqUserID"]){
                            req.session.user.accessableUserIDs= _.map(data,function(xObj){return xObj["userID"]});
                        }
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