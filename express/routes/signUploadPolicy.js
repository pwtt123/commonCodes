/**
 * Created by SE02 on 2017/11/7.
 */
var API_GET_UPLOAD_TOKEN = "getUploadToken";

var express = require('express');
var router = express.Router();
var settings = require('../settings');
var accessCheck=require('../accessCheck');
var fs = require("fs");
var path = require("path");
var crypto = require("crypto");

var publicPath = settings._URL_PUBLIC;
var chance = new (require("chance"));

var _ = require('underscore');


// ** 上传Policy有效期限 (分钟)
var uploadExpirationMinutes = settings.upload.expirationMinutes;

// ** 上传一般文件的允许最大值 (MB)
var uploadMaxFileSize = settings.upload.maxFileSize;

// ** 上传 Access Key   环境变量
var uploadAccessKey = settings.upload.accessKey;


/*
 上传文件前调用 返回签名 后的文件信息及key，
 in:
     - userID
     - pageID,模板_guid
     - extName:
     - fileName:
     - vendor:
     - type:"page"/"user"  page,以pageID，作为文件命名的一部分, 一般修改页面图片 使用
     user,以userID，作为文件命名的一部分,一般上传用户 头像 使用
     - options:{
     - isTemplate: 1/0   存在则操作模版表，不存在操作对客展示表
     }

 return:
     - filePath：服务器文件的路径
     - policy：签名内容对象
     - policyBase64：base64 编码的policy
     - signature: 加密过的数据

 */
router.post(publicPath + 'signUploadPolicy.do', function (req, res, next) {
    try {
        var zTemp = {};
        var zOptions={};
        var zTargetUserIDs;

        if(req.body.options) zOptions=JSON.parse(req.body.options);
        if(req.body.userID) zTargetUserIDs=[req.body.userID];

        //只能op和admin访问
        if (!accessCheck.checkCurrentUserRoles(req,res,[,"op","admin"])) return;

        //只有 admin 有权 上传 模版文件
        if (zOptions["isTemplate"]) {
            if(!accessCheck.checkCurrentUserRoles(req,res,["admin"])) return;
        }
        //只有 op 有权 上传 对客展示 文件
        if (!zOptions["isTemplate"]) {
            //创建对客展示 记录时 必须传userID
            if(!zTargetUserIDs)return   settings.handle("userIDNotInputted",res);
            if(!accessCheck.checkCurrentUserRoles(req, res, ["op"]))return;
        }

        //若上传到 对客展示表 到 某个 userID ，检查是否 在 可访问列表中
        if(zTargetUserIDs){
            if(!accessCheck.checkTargetUserIDs(req,res,zTargetUserIDs))return;
        }


        //设置过期时间
        var zNowDateTime = new Date();
        var zExpirationDateTime = new Date(zNowDateTime.setMinutes(zNowDateTime.getMinutes() + uploadExpirationMinutes)); // n分钟后过期
        var uploadPolicy = {
            "expiration": zExpirationDateTime.toISOString() // "2020-01-01T12:00:00.000Z", 设置该Policy的失效时间，超过这个失效时间之后，就没有办法通过这个policy上传文件了
        };

        //前端传的参数
        var zReqData = _.pick(req.body,"userID","pageID","extName","fileName","vendor","type");

//console.log("zReqData:",zReqData,"zReqData.type:",zReqData.type);

        var zExtName = zReqData.extName;
        var zPageID = zReqData.pageID;
        var zFileName = zReqData.fileName;
        var zResFilePath = "";

        if (zReqData.type == 'page') {
// b. 如果是 上传附件文件， 后端指定guid文件夹和文件名
            zExtName = zExtName ? ("." + zExtName) : "";
            // file 改成user/page
            zResFilePath = "Leia/page/" + zPageID + "/" + chance.guid() + "/" + zFileName;
            uploadPolicy.conditions = [
                ["eq", "$key", zResFilePath], // 设置文件名限制 (/avatar/<uid>+<extName>)
                ["content-length-range", 0, uploadMaxFileSize * 1024 * 1024] // 设置上传附件文件的大小限制 (bytes)
            ];
        }


        //console.log("uploadPolicy(0)", uploadPolicy);

// 如果参数出错
        if (!uploadPolicy.conditions) {
            return settings.handle("settingError", res);
        }

// 开始为 policy 签名
        var policyBase64 = new Buffer(JSON.stringify(uploadPolicy)).toString('base64');
        //var uploadAccesskey="";
        var signature = crypto.createHmac('sha1', uploadAccessKey).update(policyBase64).digest().toString('base64');

        //console.log("uploadPolicy", uploadPolicy, "signature:", signature);

        res.json({
            "policy": uploadPolicy,
            "policyBase64": policyBase64,
            "signature": signature,
            "filePath": zResFilePath
        });


    } catch (err) {
        return settings.handle(err, res);
    }
});


module.exports = router;