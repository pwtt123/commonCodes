/**
 * Created by SE02 on 2017/7/25.
 */
var express = require('express');
var router = express.Router();
var _=require('underscore');
var session = require('express-session');
var settings=require('../settings');
var publicPath=settings._URL_PUBLIC;
var privatePath=settings._URL_USER_PAGE;

//获取所有privatePath，根据请求第一个/前内容和session.user.dir判断是否可以访问,
router.get(privatePath+'*',function(req, res, next){
    try{
        var zTemp={};
        var err = new Error('Not Found');
        err.status = 404;
        if(!req.params||!req.params[0]){ next(err);return;}
        zTemp["urlDirName"]=req.params[0].substring(0,req.params[0].indexOf("/"));
        //如果访问_开头的特殊目录，放行
        if(zTemp["urlDirName"].substring(0,1)=="_"){next();return;}
        if(!req.session.user){next(err);return;}
        //如果是管理员，放行
        if(req.session.user.role=="admin"){next();}
        //如果访问的本人的文件夹，放行
        else if(zTemp["urlDirName"]==req.session.user.userID){next();}
        //否则跳到error页面
        else{next(err);}

        //console.log(req.params[0].substring(0,req.params[0].indexOf("/")));
    }
    catch (err){
        console.error(err);
        next();
    }

});


module.exports = router;