var fs = require('fs');
var path = require('path');
var  _= require('underscore');
var moment = require('moment');

//JSON对照表的地址
var _PATH_CONTRAST_JSON= process.env._PATH_CONTRAST_JSON || ".\\chineseContrast.json";
//需编译文件的地址
var _PATH_SOURCE_FILE = process.env._PATH_SOURCE_FILE || ".\\renderTest.html";

//console.log(path.basename(_PATH_SOURCE_FILE));
//console.log("aa",path.join(_PATH_CONTRAST_JSON,"..","render.js"));
//读取JSON对照表
fs.readFile(_PATH_CONTRAST_JSON,"utf-8",function(err,xJSONData){
    if(err){console.log(err); return;}
    var zTemp={};
    try{
        zTemp["对照表"]=JSON.parse(xJSONData);
        //console.log("对照表",zTemp["对照表"]);

        //读取需替换的html内容
        fs.readFile(_PATH_SOURCE_FILE,"utf-8",function(err,xHTMLData){
            if(err){console.log(err);return;}
            try{
                zTemp["需替换内容"]=xHTMLData;
                //console.log(zTemp["需替换内容"]);
                var isRenderAll=false;
                var checkEcmsRec=/<%ecms:res(.|\s)*?%>/;
                var checkEcmsDoc=/<%ecms:doc(.|\s)*?%>/;
                zTemp["EcmsRec替换成功数量"]=0;
                zTemp["EcmsDoc替换成功数量"]=0;
                //console.log(zTemp["需替换内容"].match(checkEcmsRec));

                //当存在<%ecms:res XXX%>时,替换第一个匹配到的<%ecms:res XXX%>为对照表中相应值。
                // 若对照表中不存在，则打印出并继续执行循环
                while(zTemp["需替换内容"].match(checkEcmsRec)){
                    //console.log("match",zTemp["需替换内容"].match(checkEcmsRec));
                    zTemp["key"]=zTemp["需替换内容"].match(checkEcmsRec)[0].replace(/<%ecms:res|%>|\s/g,"");
                    if(!zTemp["对照表"][path.basename(_PATH_SOURCE_FILE)][zTemp["key"]]){console.log("对照表中不存在："+zTemp["key"]);
                        zTemp["需替换内容"]=zTemp["需替换内容"].replace(zTemp["需替换内容"].match(checkEcmsRec)[0],zTemp["需替换内容"].match(checkEcmsRec)[0].replace("<","<!"));
                        continue;
                    }
                    zTemp["需替换内容"]=zTemp["需替换内容"].replace(zTemp["需替换内容"].match(checkEcmsRec)[0],zTemp["对照表"][path.basename(_PATH_SOURCE_FILE)][zTemp["key"]]);
                    zTemp["EcmsRec替换成功数量"]++;
                    //console.log("内容",zTemp["需替换内容"]);
                }


                //当存在<%ecms:doc FileName%>时,替换第一个匹配到的<%ecms:doc FileName%>为FileName对应文件中存放的值。
                // 若文件不存在，则打印出并继续执行循环
                renderDoc();
                function renderDoc(){
                    //console.log(zTemp["需替换内容"].match(checkEcmsDoc));

                    if(!zTemp["需替换内容"].match(checkEcmsDoc)){isRenderAll=true;reWriteFile();return;}
                    zTemp["renderFilePath"]=zTemp["需替换内容"].match(checkEcmsDoc)[0].replace(/<%ecms:doc|%>|\s/g,"");
                    //console.log("renderFilePath",zTemp["renderFilePath"]);

                    fs.readFile(path.join(_PATH_CONTRAST_JSON,"..",zTemp["renderFilePath"]),"utf-8",function(err,xRenderData){
                        if(err) {console.log(zTemp["renderFilePath"]+"读取出错",err);
                            zTemp["需替换内容"]=zTemp["需替换内容"].replace(zTemp["需替换内容"].match(checkEcmsDoc)[0],zTemp["需替换内容"].match(checkEcmsDoc)[0].replace("<","<!"));
                            renderDoc();return;}
                        try{

                            //console.log("aa",zTemp["renderFilePath"]);
                            //console.log("bb",path.basename(zTemp["renderFilePath"]));
                            //替换  替换文件中的 须替换字符串
                        while(xRenderData.match(checkEcmsRec)){
                            //console.log("match",zTemp["需替换内容"].match(checkEcmsRec));
                            zTemp["key"]=xRenderData.match(checkEcmsRec)[0].replace(/<%ecms:res|%>|\s/g,"");
                            if(!zTemp["对照表"][path.basename(zTemp["renderFilePath"])][zTemp["key"]]){console.log("对照表中不存在："+zTemp["key"]);
                                xRenderData=xRenderData.replace(xRenderData.match(checkEcmsRec)[0],xRenderData.match(checkEcmsRec)[0].replace("<","<!"));
                                continue;
                            }
                            xRenderData=xRenderData.replace(xRenderData.match(checkEcmsRec)[0],zTemp["对照表"][path.basename(zTemp["renderFilePath"])][zTemp["key"]]);
                            zTemp["EcmsRec替换成功数量"]++;
                            //console.log("内容",zTemp["需替换内容"]);
                        }


                            //console.log("xRenderData",xRenderData);
                            zTemp["需替换内容"]=zTemp["需替换内容"].replace(zTemp["需替换内容"].match(checkEcmsDoc)[0],xRenderData);
                            zTemp["EcmsDoc替换成功数量"]++;
                            //console.log("需替换内容",zTemp["需替换内容"]);
                            renderDoc();


                        }catch (err){
                            console.log(err)
                        }
                    });
                }

                //把编译完成完成的文件替换成原来的文件
                function reWriteFile(){
                    if(isRenderAll==true){
                        console.log("全部编译完毕");
                        console.log("EcmsRec替换成功数量:",zTemp["EcmsRec替换成功数量"]);
                        console.log("EcmsDoc替换成功数量:",zTemp["EcmsDoc替换成功数量"]);
                        //重写需编译的文件

                        fs.writeFile(_PATH_SOURCE_FILE,zTemp["需替换内容"],function(err){
                            try{
                                if(err){console.log("替换原文件错误",err);return;}
                                console.log("替换原文件成功")
                            }catch(err){
                                console.log(err);
                            }
                        });
                    }
                }


            }catch(err){
                console.log(err)
            }
        });

    }catch(err){
        console.log(err)
    }
});


function renderStrA2StrB (){

}