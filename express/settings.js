/**
 * Created by SE02 on 2017/7/25.
 */

try{

var fs = require("fs");
var _=require('underscore');

var path = require('path');
var settings={
 //静态目录
 _PATH_WEB_ROOT :process.env._PATH_WEB_ROOT || path.join(__dirname, 'webRoot\\'),
 //用户文件目录
 _PATH_USER_PAGE :process.env._PATH_USER_PAGE ||path.join(__dirname, 'webRoot\\userPage\\'),
 //评论、用户信息等系统读写的数据目录
 _PATH_DATA_ROOT :process.env._PATH_DATA_ROOT ||path.join(__dirname, 'dataRoot\\'),

 //公共目录 url
 _URL_PUBLIC:process.env._URL_PUBLIC ||"/public/",
 //评论信息目录 url
 _URL_COMMENTS:process.env._URL_COMMENTS ||"../dataRoot/comments/",
 //用户信息目录 url
 _URL_ACCOUNTS:process.env._URL_ACCOUNTS ||"../dataRoot/accounts/",
 //用户文件目录 url
 _URL_USER_PAGE:process.env._URL_USER_PAGE ||"/userPage/",
 //数据库url
 _DB_URL : process.env._DB_URL || "",
 //log collection
 _DB_LOGS : process.env._DB_LOGS || "",
 //用户信息collection
 _DB_ACCOUNTS: process.env._DB_ACCOUNTS || "",
 //存放引入js文件路径的配置文件 的 路径
 _PATH_SETTINGS_EXTERNAL_JS_FILES : process.env._PATH_SETTINGS_EXTERNAL_JS_FILES  || "",

//端口号
  port:normalizePort(process.env.PORT || '3000'),

//外部接口
 interfaces:{}


};


//err:出错信息字符串
//res: 请求 的 res
settings["handle"]= function(err,res){
 //若是_ERR中定义的错误,直接返回
 if(settings._ERR[err]){
  console.log(settings._ERR[err]);
  res.json(settings._ERR[err])
 }
 //若是未定义的错误,返回"undefinedError"
 else{
  console.log(err);
  res.json({error:"undefinedError"});
 }
};


//错误信息
settings["_ERR"]={
 //帐号为空
 "userIDIsNull":{error:"userIDIsNull"},
 //密码为空
 "pwdIsNull":{error:"pwdIsNull"},
 //修改密码为空
 "updatePwdIsNull":{error:"updatePwdIsNull"},
 //用户名长度超出范围
 "userIDLengthError":{error:"userIDLengthError"},
 //密码长度超出范围
 "pwdLengthError":{error:"pwdLengthError"},
 //修改的密码长度超出范围
 "updatePwdLengthError":{error:"updatePwdLengthError"},
 //用户名不合法（有非法字符）
 "userIDInvalid":{error:"userIDInvalid"},
 //密码不合法（有非法字符）
 "pwdInvalid":{error:"pwdInvalid"},
 //修改密码不合法（有非法字符）
 "updatePwdInvalid":{error:"updatePwdInvalid"},
 //请求未通过
 "accessDenied":{error:"accessDenied"},
 //评论内容为空
 "commentIsNull":{error:"commentIsNull"},
 //外部接口未定义
 "interfaceNotFound":{error:"interfaceNotFound"},
 //未定义的角色
 "rolesNotFound":{error:"rolesNotFound"},

 //未传userID
 "userIDNotInputted":{error:"userIDNotInputted"},

 //设置出错
 "settingError":{error:"settingError"}

};


//上传文件设置相关
settings["upload"]={
 // 文件加密的 key
 accessKey: process.env._UPLOAD_accessKey ||"qly5Z14lykRyVK1sydNF7DXkwgz9pB",
 // 上传一般文件的允许最大值 (MB)
 maxFileSize: Number(process.env._UPLOAD_maxFileSize) || 1,

 // 文件过期的时间 （min）
 expirationMinutes:Number( process.env._UPLOAD_expirationMinutes) || 5

};

//console.log("upload",settings["upload"])

//从配置文件  _PATH_REQUIRE_JS.json 中载入 应用的js地址
//{接口名：js文件地址}

 //读取配置文件
  fs.readFile(settings._PATH_SETTINGS_EXTERNAL_JS_FILES , "utf8",function(err,data){
   try{

   if(err){console.log("WARNING: _PATH_SETTINGS_EXTERNAL_JS_FILES is not defined");return}
   console.log("_PATH_SETTINGS_EXTERNAL_JS_FILES loaded");
   var zIniData=data.substring(data.indexOf("{"));
   //console.log(zIniData)
   zIniData=JSON.parse(zIniData);

 //把配置文件中的数据存入 settings
   _.each(zIniData,function(xObj,xIndex){
    settings["interfaces"][xIndex]=xObj["path"]
   });

    //console.log(settings)

  }
   catch(err){
     console.log(err)
 }

 });



//console.log(settings._PATH_WEB_ROOT);
//console.log(settings._PATH_USER_PAGE);
//console.log(settings._PATH_DATA_ROOT);

//console.log(settings)

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
 var port = parseInt(val, 10);

 if (isNaN(port)) {
  // named pipe
  return val;
 }

 if (port >= 0) {
  // port number
  return port;
 }

 return false;
}
module.exports=settings;

}catch(err){console.log(err)}