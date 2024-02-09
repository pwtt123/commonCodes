/**
 * Created by SE02 on 2017/9/11.
 */
var express = require('express');
var router = express.Router();
var _=require('underscore');
var session = require('express-session');
var path = require('path');
var moment = require('moment');
var accessCheck=require('../accessCheck');
var zInterface=require('../interface');
var settings=require('../settings');
var _ERR=settings._ERR;

var publicPath=settings._URL_PUBLIC;

//console.log(typeof(moment("2011-10-31", "YYYY-MM-DD").format("MM")));

//传startDate，endDate,daily/monthly/weekly,返回统计结果
router.post(publicPath+'getAUData.do', function (req, res, next) {
    var zTemp={};
    try{

        //只能admin访问
        if (!accessCheck.checkCurrentUserRoles(req,res,["admin"])) return;


        zTemp["userObj"]=req.session.user;

        var zStartDate=req.body.startDate?new Date(req.body.startDate):new Date("0000-00-00 00:00:00");
        var zEndDate=req.body.endDate?new Date(req.body.endDate):new Date(moment().format("YYYY-MM-DD HH:mm:ss"));
        var zFrequency=req.body.frequency;


        //console.log(zStartDate);
        //console.log(zEndDate);
        //console.log(zFrequency);




        //根据不同的频率生成不同的分组查询条件
        if(zFrequency=="daily"){

            zTemp["分组"]={"userID":"$userID","year":{$year:{$add:["$time",28800000]}},"month":{$month:{$add:["$time",28800000]}},"day":{$dayOfMonth:{$add:["$time",28800000]}}};
        }
        if(zFrequency=="monthly"){

            zTemp["分组"]={"userID":"$userID","year":{$year:{$add:["$time",28800000]}},"month":{$month:{$add:["$time",28800000]}}};
        }
        if(zFrequency=="weekly"){
            zTemp["分组"]={"userID":"$userID","year":{$year:{$add:["$time",28800000]}},"week":{$week:{$add:["$time",28800000]}}};
        }

        //console.log(zStartDate);
        //console.log(typeof (zEndDate));
        //console.log(zStartDate<zEndDate);
        //console.log(zTemp["分组"]);


        zTemp["外部getAUData数据"]={
            startDate:zStartDate,
            endDate:zEndDate,
            frequency:zFrequency
        };
        //存在配置文件引入外部js
        if(settings.interfaces.getAUData){
            try{

                //调用外部接口
                zInterface.execExternalInterface(
                    settings.interfaces.getAUData,
                    zTemp["外部getAUData数据"],
                    null,
                    function(err,data){
                        zInterface.runCommonCallback(err,data,res)
                    });


            }
            catch(err){
                return settings.handle(err,res)
            }
        }
        //配置文件不存在
        else {
            settings.handle("interfaceNotFound",res);
        }


        //  //数据库聚合，得到数组，进行处理
        //try{
        //
        //    db.logsCol.aggregate([
        //        { $match : { time:{$gt:zStartDate, $lt :zEndDate}} },
        //        {$group : {_id :zTemp["分组"],loginNum: {$sum : 1}}}
        //    ]).toArray(function(err,docs){
        //    try{
        //
        //
        //        //var zAllLoginNum=_.(docs,function(memo,xObj){
        //        //    return memo + Number(xObj["loginNum"])
        //        //},0);
        //
        //        zTemp["时间分组集合"]={};
        //        zTemp["返回对象"]={};
        //
        //        //res.json({success:docs});
        //
        //        //根据不同的时间频率分组
        //        if (zFrequency=="daily"){
        //            zTemp["时间分组集合"]= _.groupBy(docs, function(xObj){ return xObj["_id"]["year"]+"-"+xObj["_id"]["month"]+"-"+xObj["_id"]["day"]; });
        //        }
        //        if (zFrequency=="monthly"){
        //            zTemp["时间分组集合"]= _.groupBy(docs, function(xObj){ return xObj["_id"]["year"]+"-"+xObj["_id"]["month"]; });
        //        }
        //        if (zFrequency=="weekly"){
        //            zTemp["时间分组集合"]= _.groupBy(docs, function(xObj){ return xObj["_id"]["year"]+"-"+xObj["_id"]["week"]; });
        //        }
        //
        //        //遍历时间分组
        //        _.each(zTemp["时间分组集合"],function(xArray,xIndex){
        //            zTemp["访问总量"]=0;
        //            zTemp["只访问一次的用户数"]=0;
        //            zTemp["访问多次的用户数"]=0;
        //            if(!xArray.length) return;
        //            zTemp["用户数"]=xArray.length;
        //
        //            //遍历每个时间分组的数据
        //            _.each(xArray,function(xxObj){
        //                zTemp["访问总量"]+=xxObj["loginNum"];
        //                if(xxObj["loginNum"]==1){
        //                    zTemp["只访问一次的用户数"]++
        //                }else{
        //                    zTemp["访问多次的用户数"]++
        //                }
        //            });
        //            zTemp["平均访问次数"]=zTemp["访问总量"]/ zTemp["用户数"];
        //            zTemp["非1次访问平均访问次数"]=(zTemp["访问总量"]-zTemp["只访问一次的用户数"])/ zTemp["访问多次的用户数"];
        //
        //            zTemp["返回对象"][xIndex]={"访问总量":zTemp["访问总量"],"用户数":zTemp["用户数"],"只访问一次的用户数":zTemp["只访问一次的用户数"],"访问多次的用户数":zTemp["访问多次的用户数"],"平均访问次数":zTemp["平均访问次数"].toFixed(2),"非1次访问平均访问次数":zTemp["非1次访问平均访问次数"].toFixed(2)};
        //        });
        //
        //        res.json(zTemp["返回对象"])
        //
        //    } catch (err){
        //        console.log(err);
        //        next();
        //    }
        //
        //    });
        //
        //}catch (err){
        //    console.log(err);
        //    next();
        //}


    }catch (err){
        return settings.handle(err,res)
    }
});

module.exports = router;