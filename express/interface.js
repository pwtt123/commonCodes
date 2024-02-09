/**
 * Created by SE02 on 2017/11/2.
 */


var _ = require('underscore');
var session = require('express-session');
var settings = require('./settings');
var path = require('path');
var _ERR = settings._ERR;

module.exports = {

    //引入外部接口，调用外部接口的exec方法，获取数据后 返回 前端 json 对象
    //xInterfacePath,外部接口的路径
    //xInput,外部接口exec 的 xInput参数
    //xOptions,外部接口exec 的 xOptions参数
    //xCallBack(err,data), 外部接口返回的 err 及 data 数据
    execExternalInterface: function (xInterfacePath, xInput, xOptions, xCallBack) {
        try {
            //调用js
            var zInterface = require(xInterfacePath);

            //用underscore 判断是否时一个方法
            if (!_.isFunction(zInterface.exec)) return xCallBack("accessDenied");

            console.log("引用" + xInterfacePath);
            //调用js中的 exec 方法
            zInterface.exec(xInput, xOptions, xCallBack);
        }
        catch (err) {
            return xCallBack("undefinedError");
        }
    },

    //处理外部接口的回调内容
    //若data为空，返回 {}
    //若data不为空，返回data
    //err:外部接口返回的错误信息。
    //data:外部接口返回的数据
    //res : post请求的返回
    runCommonCallback: function (err, data, res) {
        if (err)return res.json(err);

        if (!data) res.json({});
        else res.json(data);

    }


};