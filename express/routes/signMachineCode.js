/**
 * Created by SE02 on 2017/10/17.
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
    var NodeRSA = require("node-rsa");
    var key = new NodeRSA();
    var pvk = fs.readFileSync("private.pem", "utf8");
//console.log(pvk)
    key.importKey(pvk, "pkcs8-private-pem");
//加密字符
    var decipher = crypto.createDecipher('aes-256-cbc','InmbuvP6Z8');

//获取前端的机器码 以及激活码，判断激活码正确后，读取私钥，加密后返回给前端
    router.post(publicPath+'signMachineCode.do', function (req, res, next) {
        try{
            //console.log("req",req.body);
            //数据解密
            //_.each(req.body,function(xString,xIndex){
            //    var decData = decipher.update(xIndex,'hex','utf8');
            //    decData += decipher.final('utf8');
            //    console.log("decData",decData);
            //});
            //
            //console.log("req",req.body);

            _.each(req.body,function(xString,xIndex){
                var reqData=JSON.parse(xIndex);
                var zSigData = key.sign(reqData["computerID"],'base64');

                res.json({success:zSigData});
                //res.json({success:"ActivationCode"});
                //console.log("ActivationCode");
            });
            //var reqData=JSON.stringify(req.body["data"]);


        }catch(err){
            return settings.handle(err,res)
        }
    });

}catch(err){
    return settings.handle(err,res)
}






module.exports = router;