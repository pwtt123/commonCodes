/**
 * Created by SE02 on 2017/11/2.
 */



var _=require('underscore');
var session = require('express-session');
var settings=require('./settings');
var path = require('path');
var _ERR=settings._ERR;






module.exports={

    //检查用户角色的权限
    //xReq: post的req参数
    //xRes: post的res参数
    //xApprovedRoles: 有权限的角色 集合 ["user","op"]
    checkCurrentUserRoles:function(req,res,xApprovedRoles){

        if(!req.session.user||!req.session.user.roles){
            settings.handle("accessDenied",res);
            return false;
        }
        var zRoles=req.session.user.roles;
        // 用户的角色集合 与 可使用角色集合 没有交集，返回错误
        if(!_.intersection(xApprovedRoles,zRoles).length){
            settings.handle("accessDenied",res);
            return false;
        }
            return true
    },

    //检查userIDs是否在可使用列表中
    //xReq: post的req参数
    //xRes: post的res参数
    //xTargetUserIDs: 请求获取userID 的集合 :["pwt","amy"]
    checkTargetUserIDs:function(req,res,xTargetUserIDs){
        if(!req.session.user||!req.session.user.accessableUserIDs){
            settings.handle("accessDenied",res);
            return false;
        }
        var zAccessableUserIDs=req.session.user.accessableUserIDs;
        //如果 请求获取的userID ,不完全包含在 可访问列表中，返回错误

        //console.log("xTargetUserIDs",xTargetUserIDs)
        //console.log("zAccessableUserIDs",zAccessableUserIDs)

        if(_.intersection(zAccessableUserIDs,xTargetUserIDs).length != xTargetUserIDs.length){
            settings.handle("accessDenied",res);
            return false;
        }
            return true;

    },

    //检查userGroupIDs是否在 分组组合 中
    //xReq: post的req参数
    //xRes: post的res参数
    //xTargetGroupIDs: 请求获取 userGroupID 的集合 ["分组1","分组2"]
    checkTargetGroupIDs:function(req,res,xTargetGroupIDs){
        if(!req.session.user||!req.session.user.userGroupIDs){
            settings.handle("accessDenied",res);
            return false;

        }
        var zUserGroupIDs=req.session.user.userGroupIDs;
        //如果 请求获取的userGroupIDs,不完全包含在 分组组合中，返回错误
        if(_.intersection(zUserGroupIDs,xTargetGroupIDs).length !=xTargetGroupIDs.length){
            settings.handle("accessDenied",res);
            return false;

        }
            return true;
    },


    //检查branchID是否在 分店组合 中
    //xReq: post的req参数
    //xRes: post的res参数
    //xTargetBranchIDs: 请求获取 branchID 的集合 ["分店1","分店2"]
    checkTargetBranchIDs:function(req,res,xTargetBranchIDs){
        if(!req.session.user||!req.session.user.branchIDs){
            settings.handle("accessDenied",res);
            return false;

        }
        var zBranchIDs=req.session.user.branchIDs;
        //如果 请求获取的branchIDs,不完全包含在 分组组合中，返回错误
        if(_.intersection(zBranchIDs,xTargetBranchIDs).length !=xTargetBranchIDs.length){
            settings.handle("accessDenied",res);
            return false;

        }
        return true;
    }



};