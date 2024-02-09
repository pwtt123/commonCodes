var express = require('express');
var router = express.Router();
var _ = require('underscore');
var session = require('express-session');
var settings = require('../settings');
var publicPath = settings._URL_PUBLIC;
var accessCheck = require('../accessCheck');
var zInterface = require('../interface');


var checkPwd = /^[0-9a-zA-Z_#@-]{2,36}$/;
var checkUserID = /^[0-9a-zA-Z_#@-]{2,19}$/;


//后端, 获取ajax的密码，判断是否为空，
// 然后查看密码表中此密码是否存在，此密码对应的文件是否存在，不通过返回err，
// 通过，返回success
router.post(publicPath + 'login.do', function (req, res, next) {
    var zTemp = {};
    //console.log(req.ip);
    //console.log(req.ips);
    //获得并检查前端传递的的密码
    try {


        if (!req.body.pwd) {
            return settings.handle("pwdIsNull", res);
        }
        if (!req.body.userID) {
            return settings.handle("userIDIsNull", res)
        }
        if (!checkUserID.test(req.body.UserID)) {
            return settings.handle("UserIDInvalid", res)
        }
        if (!checkPwd.test(req.body.pwd)) {
            return settings.handle("pwdInvalid", res)
        }
        zTemp["userID"] = req.body.userID;
        zTemp["pwd"] = req.body.pwd;
        //console.log(zTemp["pwd"]);

        zTemp["登录信息"] = {"userID": zTemp["userID"], "pwd": zTemp["pwd"]};

//console.log("登录信息",zTemp["登录信息"])

        //若配置文件存在，引入外部js
        if (settings.interfaces.login) {
            try {

                //调用外部接口
                zInterface.execExternalInterface(
                    settings.interfaces.login, zTemp["登录信息"],
                    null,
                    function (err, data) {
                        //用户信息保存到session.user
                        req.session.user = data;
                        zInterface.runCommonCallback(err, data, res)
                    }
                );


            }
            catch (err) {
                return settings.handle(err, res)
            }

        }

        //外部接口不存在
        else {
            settings.handle("interfaceNotFound", res);
        }


//console.log(req.session.user);
    } catch (err) {
        return settings.handle(err, res)
    }

});

module.exports = router;