/**
 * Created by SE02 on 2017/8/18.
 */
var mongodb= require('mongodb');
var monk = require('monk');
var  _= require('underscore');
var fs = require('fs');
var path = require('path');
//var db = monk('localhost/count');
//var db_logs = db.get('logs');


//var DataFromMongodb = function(db) {
//    return function(req, res) {
//        var collection = db.get('usercollection');
//        collection.find({},{},function(e,docs){
//
//        });
//    };
//};
//db_logs.find({},function(err,docs){
//        console.log(err)
//});
//db_logs.insert({"name":"orange juice","description":"just so so"});
//db_logs.find({}, {sort: {name: 1}}).then(function () {
//    // sorted by name field
//})
//db_logs.remove({ name: 'Loki' })
//db.close();

var _SERVER=process.env._SERVER || "localhost:27017:true";
var _DB =process.env._DB || "counts";
var _COLLECTION=process.env._COLLECTION || "logs";
var _MAX_TIME = process.env._MAX_TIME || "2017-09-02 09:30:58";
var _MIN_TIME = process.env._MIN_TIME || "2017-07-02 09:30:58";
var _PATH_SAVE_JSON=process.env._PATH_SAVE_JSON || ".\\";
var _NUM_TOP_LOGIN=process.env._NUM_TOP_LOGIN || "10";
var _NUM_TOP_USER=process.env._NUM_TOP_USER || "10";

//console.log("=false?",_SERVER.split(":")[2]==="false");

var  server  = new mongodb.Server(_SERVER.split(":")[0],
    Number(_SERVER.split(":")[1]),{auto_reconnect:_SERVER.split(":")[2]==="false"?false:true});
var  db = new mongodb.Db(_DB, server, {safe:true});

db.open(function(err, db){
    var zTemp={};
    if(!err){
        console.log('连接数据库成功');
        // 连接Collection（可以认为是mysql的table）
        // 第1种连接方式
        // db.collection('mycoll',{safe:true}, function(err, collection){
        //     if(err){
        //         console.log(err);
        //     }
        // });
        // 第2种连接方式
        db.createCollection(_COLLECTION,  function(err, collection){
            if(err){console.log(err);return;}

                //新增数据
                // var tmp1 = {id:'1',title:'hello',number:1};
                //          collection.insert(tmp1,{safe:true},function(err, result){
                //              console.log(result);
                //          });
                //更新数据
                // collection.update({title:'hello'}, {$set:{number:3}}, {safe:true}, function(err, result){
                //     console.log(result);
                // });
                // 删除数据
                // collection.remove({title:'hello'},{safe:true},function(err,result){
                //                   console.log(result);
                //               });

                // console.log(collection);
                // 创建索引
                collection.ensureIndex({"time":-1,"userID":1}, {background: true});
                //collection.find({time:{$gt:"2017-08-02 09:30:58",$lt :"2017-08-04 09:30:58"}}).toArray(function(err,docs){
                //    console.log("总登录次数",docs.length);
                //});

            //数据库聚合，得到数组，进行处理
            collection.aggregate([
                { $match : { time:{$gt:_MIN_TIME,
                    $lt :_MAX_TIME}} },
                {$group : {_id : "$userID",loginNum: {$sum : 1}}}
            ]).toArray(function(err,docs){
                console.log("时间范围："+_MIN_TIME+"——"+_MAX_TIME);
                zTemp["登录用户数"]=docs.length;
                console.log("登录用户数:",zTemp["登录用户数"]);
                //var zAllLoginNum=_.(docs,function(memo,xObj){
                //    return memo + Number(xObj["loginNum"])
                //},0);
                zTemp["总登录数"]=0;
                zTemp["用户登录数数组"]=[];
                _.each(docs,function(xObj){
                    zTemp["总登录数"]+=xObj["loginNum"];
                    zTemp["用户登录数数组"].push(xObj["loginNum"])
                });
                zTemp["用户登录数数组"]=_.sortBy(zTemp["用户登录数数组"],function(num){ return -num; });
                zTemp["登录次数"]=zTemp["用户登录数数组"][0]?zTemp["用户登录数数组"][0]:0;
                zTemp["此登录数用户数"]=0;

                console.log("总登录数：",zTemp["总登录数"]);
                if(zTemp["总登录数"]==0)return;
                zTemp["平均每个用户登录数"]=zTemp["总登录数"]/docs.length;
                console.log("平均每个用户登录数：",zTemp["平均每个用户登录数"]);

                zTemp["JSON数据"]={};
                zTemp["JSON数据"]["maxTime"]=_MAX_TIME;
                zTemp["JSON数据"]["minTime"]=_MIN_TIME;
                zTemp["JSON数据"]["总登录数"]=zTemp["总登录数"];
                zTemp["JSON数据"]["登录用户数"]=zTemp["登录用户数"];
                zTemp["JSON数据"]["平均每个用户登录数"]=zTemp["平均每个用户登录数"];
                zTemp["登录次数集合"]=[];

                _.each(zTemp["用户登录数数组"],function(xNum){
                    if(xNum!=zTemp["登录次数"]){
                        zTemp["登录次数集合"].push({ loginNum:zTemp["登录次数"],userNum:zTemp["此登录数用户数"]});
                        //console.log("登录"+zTemp["登录次数"]+"次的用户数：",zTemp["此登录数用户数"]);
                        zTemp["登录次数"]=xNum;
                        zTemp["此登录数用户数"]=1;
                    }else{
                        zTemp["此登录数用户数"]++;
                    }
                });
                //console.log("登录"+zTemp["登录次数"]+"次的用户数：",zTemp["此登录数用户数"]);
                zTemp["登录次数集合"].push({ loginNum:zTemp["登录次数"],userNum:zTemp["此登录数用户数"]});


                //console.log(zTemp["登录次数集合"]);

             zTemp["用户登录数Top集合"]=_.sortBy(zTemp["登录次数集合"],function(xObj){return -xObj["userNum"]});
             zTemp["登录次数Top集合"]=_.sortBy(zTemp["登录次数集合"],function(xObj){return -xObj["loginNum"]});

                //console.log("用户登录数Top集合",zTemp["用户登录数Top集合"]);
                //console.log("登录次数Top集合",zTemp["登录次数Top集合"]);

                //zTemp["JSON数据"]["用户登录数Top集合"]={};
                zTemp["JSON数据"]["登录次数Top集合"]={};
                //_.each(zTemp["用户登录数Top集合"],function(xObj,xIndex){
                //    if(xIndex>=Number(_NUM_TOP_USER)) return;
                //    zTemp["JSON数据"]["用户登录数Top集合"]["登录"+xObj["loginNum"]+"次的人数"]=xObj["userNum"]
                //});
                _.each(zTemp["登录次数Top集合"],function(xObj,xIndex){
                    if(xIndex>=Number(_NUM_TOP_LOGIN)) return;
                    zTemp["JSON数据"]["登录次数Top集合"]["登录"+xObj["loginNum"]+"次的人数"]=xObj["userNum"]
                });

                //console.log("用户登录数Top集合",zTemp["JSON数据"]["用户登录数Top集合"]);

                console.log("登录次数Top集合",zTemp["JSON数据"]["登录次数Top集合"]);
                //console.log(zTemp["JSON数据"]);

                //zTemp["JSON数据"]["用户登录数数组"]=zTemp["用户登录数数组"];
                zTemp["JSON数据"]["总登录数"]=zTemp["总登录数"];
                zTemp["JSON数据"]["平均每个用户登录数"]=zTemp["平均每个用户登录数"];
                zTemp["JSON数据"]["登录用户数"]=zTemp["登录用户数"];


                fs.writeFile(path.join(_PATH_SAVE_JSON,"countDataFromMongodb"+".json"),JSON.stringify(zTemp["JSON数据"]),function(err){
                    try{
                        if(err){console.log(err);return;}
                        console.log("成功保存JSON文件")
                    }catch(err){
                        console.log(err);
                    }
                });

                //console.log("用户登录数数组(每一项为每个用户的登录数，有大到小排列)",zTemp["用户登录数数组"]);
                //console.log(docs);
            });


        });
        // console.log('delete ...');
        // //删除Collection
        // db.dropCollection('mycoll',{safe:true},function(err,result){

        //           if(err){

        //         console.log('err:');
        //         console.log(err);
        //     }else{
        //         console.log('ok:');
        //         console.log(result);
        //     }
        //       });
    }else{
        console.log(err);
    }
});