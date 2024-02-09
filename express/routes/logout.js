/**
 * Created by SE02 on 2017/8/1.
 */
var express = require('express');
var router = express.Router();
var _=require('underscore');
var session = require('express-session');
var settings=require('../settings');
var publicPath=settings._URL_PUBLIC;

router.post(publicPath+'logout.do', function (req, res, next) {
    try{
    req.session.user="";
    res.json({})
    }catch(err){
        return settings.handle(err,res)
    }
});

module.exports = router;