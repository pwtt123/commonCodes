var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
var _=require('underscore');
var fs=require('fs');
var moment = require('moment');
var url = require('url');
var app = express();


var login = require('./routes/login');
var getRelatedUserDocs = require('./routes/getRelatedUserDocs');
var readComments = require('./routes/readComments');
var writeComment = require('./routes/writeComment');
var accessUserPage = require('./routes/accessUserPage');
var logout = require('./routes/logout');
var getActivationCode = require('./routes/getActivationCode');
var signMachineCode= require('./routes/signMachineCode');
var writeLog = require('./routes/writeLog');
var  register= require('./routes/register');
var  getAUData= require('./routes/getAUData');
var  createPage= require('./routes/createPage');
var  updatePage= require('./routes/updatePage');
var  deletePage= require('./routes/deletePage');
var  readPage= require('./routes/readPage');
var  createPageDetail= require('./routes/createPageDetail');
var  updatePageDetail= require('./routes/updatePageDetail');
var  deletePageDetail= require('./routes/deletePageDetail');
var  clonePage= require('./routes/clonePage');
var  getPageDocs= require('./routes/getPageDocs');

var  getUserGroups= require('./routes/getUserGroups');
var  createUserGroup= require('./routes/createUserGroup');
var  updateUserGroup= require('./routes/updateUserGroup');

var  signUploadPolicy= require('./routes/signUploadPolicy');


var settings=require('./settings');
var publicPath=settings._URL_PUBLIC;
var privatePath=settings._URL_USER_PAGE;


//var zxc=/^[0-9a-zA-Z_#@-]{2,36}$/;
//console.log(zxc.test("asda你好sd"));
//console.log();
// view engine setup

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({'secret': process.env.SESSION_SECRET || '654321',"resave":true,"saveUninitialized":false,"cookie":{ maxAge: parseInt(process.env.COOKIE_MAXAGE)|| 60000 }}));

//console.log(process.env.COOKIE_MAXAGE);
//console.log(typeof (process.env.COOKIE_MAXAGE));


app.use('/daili.php', filter.auth, function (req, res, next) {
    let pag = req.query.pag;

    let newpag = parseInt(pag);
    let spag = 10 * newpag;
    var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://localhost:27017/";
    MongoClient.connect(url, function (err, db) {
        let dbo = db.db("game");
        let myusername = req.session.username;
        var touzhuexp = dbo.collection("game_user");
        var xiaofei = dbo.collection("bet_single_res");
        var back = dbo.collection("pricrewin");
        let mybet = { yao: myusername };
        console.log(touzhuexp)
        touzhuexp.find(mybet).sort({ _id: -1 }).skip(0).limit(10).toArray(function (err, result) { // 返回集合中所有数据
            if (err) return err;
            //在xiaofei中　查找name为　result.username　的count字段的总和
            //在back中　查找user为　result.username　的count字段的总和
            // for (let i = 0; i < result.length; i++) {
            //     let ele = result[i];
            //     (async (element, dbName) => {   ///获取消费总和
            //         try {
            //             let result1 = await getCount(dbName, { name: element.username });
            //     console.log(result1+"666666");
            //     ele['xiaofeiCount'] = result1[0].count;
            // } catch (e) {
            //         return e;
            //     }
            // })(ele, xiaofei);
            //
            //     (async (element, dbName) => {   ///获取返点总和
            //         try {
            //             let result1 = await getCount(dbName, { user: element.username });
            //     console.log(result1+"77777777");
            //     ele['backCount'] = result1[0].count;
            // } catch (e) {
            //         return e;
            //     }
            // })(ele, back);
            // }
            db.close();
            console.log(result)
            return res.render("daili", {items: result});
        });
    })
});

// function getCount(dbName, match) {  ///根据不同表名获取字段count总和
//     console.log("8888888")
//     //console.log(dbName)
//     return new Promise((resolve, reject) => {
//             dbName.aggregate([{
//             $match: {match},
//             $group: {
//                 count: {$sum: "$count" }
//             },
//         }]).toArray((err, doc) => {
//             if (err)
//             reject(err);    ///跳出代码
//     console.log("999999999")
//     resolve(doc);
// })
// })
// }



//获取端口号
app.set('port', settings.port);

//传入userID，pwd，updatePwd,userName,等信息，注册时，userID,pwd不能为空且不能有特殊字符，验证未通过返回｛error:"..."｝，通过会在dataRoot下创建
//新的用户JSON文件，同时在webRoot/userPage下创建用户的文件夹，并且返回｛success:"registerSuccess"｝
//修改时,userID,pwd,updatePwd,不能为空且不能有特殊字符，密码不正确或验证不通过返回｛error:"..."｝，通过，会修改用户传入的
//信息,为传的信息不会修改，返回｛success:"modifySuccess"｝
app.post(publicPath+'register.do', register);

//后端, 获取ajax的密码，判断是否为空，
// 然后查看密码表中此密码是否存在，此密码对应的文件是否存在，不通过返回error，
// 通过，返回success
app.post(publicPath+'login.do', login);

//获取请求后，注销session.user 返回{success:logoutSuccess}
app.post(publicPath+'logout.do', logout);

//获取所有privatePath，根据请求第一个/前内容和session.user.dir判断是否可以访问,
app.get(privatePath+'*', accessUserPage);

//session.role为老师，返回所有dir，role为家长，且dir存在，返回dir
app.post(publicPath+'getRelatedUserDocs.do', getRelatedUserDocs);



//获取 comment.do ajax的评论内容和dir，session.user不存在，返回error 存在根据传入的dir,获取时间，和评论内容组成json对象，
// 写入$comment下
app.post(publicPath+'writeComment.do', writeComment);


//传入userID,验证未通过或出错，返回{error:"xxx"} ，正常返回对应的评论对象
//属性有time:评论的时间，value:评论的内容，isAdmin:是管理员的评论会有这个属性，值为true，普通用户没有这个属性
app.post(publicPath+'readComments.do', readComments);

//保存log信息
app.post(publicPath+'writeLog.do', writeLog);

//返回前端未激活的激活码，把用户信息存入数据库
app.post(publicPath+'getActivationCode.do', getActivationCode);

//获取前端的机器码 以及激活码，判断激活码正确后，读取私钥，加密后返回给前端
app.post(publicPath+'signMachineCode.do', signMachineCode);

//传startDate，endDate,daily/monthly/weekly,返回统计结果
app.post(publicPath+'getAUData.do', getAUData);

//创建对客展示页
app.post(publicPath+'createPage.do', createPage);

//修改对客展示页
app.post(publicPath+'updatePage.do', updatePage);

//创建对客展示页
app.post(publicPath+'deletePage.do', deletePage);

//读取对客展示页
app.post(publicPath+'readPage.do', readPage);

//复制对客展示页
app.post(publicPath+'clonePage.do', clonePage);

//获取对客展示页ID集合
app.post(publicPath+'getPageDocs.do', getPageDocs);

//创建组件明细
app.post(publicPath+'createPageDetail.do', createPageDetail);

//修改组件明细
app.post(publicPath+'updatePageDetail.do', updatePageDetail);

//创建组件明细
app.post(publicPath+'deletePageDetail.do', deletePageDetail);


//获取分组分店 信息
app.post(publicPath+'getUserGroups.do', getUserGroups);

//创建分组分店 信息
app.post(publicPath+'createUserGroup.do', createUserGroup);

//修改分组分店 信息
app.post(publicPath+'updateUserGroup.do', updateUserGroup);



//获取上传文件签名
app.post(publicPath+'signUploadPolicy.do', signUploadPolicy);


//console.log(path.join(__dirname, 'webRoot'));
app.use(express.static( process.env.STATIC || path.join(__dirname, 'webRoot')));
//app.use(express.static("C:\\pwt\\WebstormProjects\\backLogger\\webRoot" ));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  //res.render('error');
  res.send("");
});

module.exports = app;

