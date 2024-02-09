var {remote} = require('electron');
var path=require("path")
var Thenjs = require("Thenjs");

//引入 全局 的 finderManager 和fileCacheManager 实例
var finderManager= remote.getGlobal('finderManager');
var fileCacheManager= remote.getGlobal('fileCacheManager');

var zOldTime=new Date();
var zNum=0;
// setInterval(function () {
//   zNum++;
//   console.log(zNum,new Date()-zOldTime);
//   zOldTime=new Date();
// },500);

function cerr(log) {
  console.log(log)
}

// console.log(finderManager)
// console.log(fileCacheManager)

var dataBoxTest;
$(function () {


  dataBoxTest= new Vue({
    el:"#dataBoxTest",
    data:{
      dataBoxPath:path.join(__dirname,"./testExcel"),
      dataBoxName:"excel"
    },
    mounted:function () {
      var zThis=this;
      this.$nextTick(function () {
        zThis.onDataBoxChanged('./testExcel',"excel");
      })

    },
    methods:{
      //切换资料库
      onDataBoxChanged:function (xDataBoxPath,xDataBoxName) {
        if(xDataBoxName)this.dataBoxName=xDataBoxName;
        if(xDataBoxPath)this.dataBoxPath=path.join(__dirname,xDataBoxPath);
        var zDataBox2Path=path.join(__dirname,"testData2")
        var zDataBox={
            boxName:xDataBoxName,
            boxRootPath:this.dataBoxPath,
          isCacheAutoStart:0,
          settings:{maxQueryLimitNum:10000},
          relatedBoxList:{
           [zDataBox2Path]:{
              "媒体类型":["媒体类型","备注"],
              "平台":["平台"]
            },
           }
          // isFinderQueryOnly:1,
          // isCacheForbidden:1,
        };

// fileCacheManager 增加一个资料库
        fileCacheManager.addDataBox(zDataBox,function (err) {
            console.log("addDataBox",err);
          });

        fileCacheManager.switchDataBox(zDataBox.boxRootPath,function (err) {
            if(err)console.log("err:",err);
          }
        )
// 切换资料库



      },

      removeDataBox:function (xBoxRootPath) {
        fileCacheManager.removeDataBox(path.join(__dirname,xBoxRootPath),function (err) {
            console.log("removeDataBox",err);
        })
      },


      //打开 新窗口
      createFinderWindow:function () {
        var zOptions={
          ifOpenDevTools:1,
          boxRootPath:this.dataBoxPath,
          superTags:{
            "葛甲key" :{
              filePath:"C:\\pwt\\electron-V1.7.6\\resources\\app\\superTags\\葛甲.txt",
              groupName:"活动场地",
              iconClass:"imgH24 no-overflow rc99",
              iconImage:"file:///C:/Users/aaa/中场.jpg?20180312-1444",
              order:30,
              tagKey:"葛甲key",
              tagName:"葛甲",
            }}
        };
        // console.log("zOptions",zOptions)
        // 打开Finder页面,并传递参数
        finderManager.startFinder(zOptions,function (err) {
          if(err)console.log(err);
        })
      },

      addTglTest:function () {
        var zDataBox = {
          boxName: "full",
          boxRootPath: "C:/test/tgl",
          isFinderQueryOnly: 0,
          isCacheAutoStart: 0, // todo: test issue for auto start
          isCacheForbidden: 0,
          relatedBoxList: {
            "contacts": {"联系人": ["联系人", "备注"], 地区: ["地区"]}
          },
          settings: {
            maxQueryLimitNum: 40
          }
        };


        setTimeout(() => {
          cerr("fileCacheManager.addDataBox", "starts");
// fileCacheManager 增加一个资料库
          fileCacheManager.addDataBox(zDataBox, (err) => {
            cerr(err);
          });
          cerr("fileCacheManager.addDataBox", "ends");
        }, 8000)


        setTimeout(() => {

          cerr("fileCacheManager.switchDataBox", "starts");

// 切换资料库
          fileCacheManager.switchDataBox(zDataBox.boxRootPath, (err) => {
            cerr(err);
          });


        }, 16000)


        setTimeout(() => {

          cerr("finderManager.startFinder", "starts");

// 打开Finder页面,并传递参数
//finderManager.startFinder({boxName:zDataBox.boxName,keyword:"上海"});
          finderManager.startFinder({boxRootPath: zDataBox.boxRootPath}, (err) => {
            cerr(err);
          });


        }, 24000)



      }
    },
    template:`
    <div>
    <h3>dataBoxTest</h3>
    {{dataBoxPath}}
    <button @click="onDataBoxChanged('./testExcel','excel')">切换资料库1</button>
    <button @click="onDataBoxChanged('./testData2','data2')">切换资料库2</button>
    <button @click="onDataBoxChanged('./testData3','data3')">切换资料库3</button>
    <button @click="addTglTest()">tgl测试</button>
    <br>
    <br>
    <button @click="createFinderWindow">打开聚合页面</button>
    <br>
    <button @click="removeDataBox('./testExcel')">删除资料库1</button>
    <button @click="removeDataBox('./testData2')">删除资料库2</button>
    <button @click="removeDataBox('./testData3')">删除资料库2</button>
    
   

    
    <!--<br>-->
    <!--<br>-->
    <!--<button @click="createWindow('moduleTest.html')">打开模块测试界面</button>-->
    <!---->
    <!--<br>-->
    <!--<br>-->
    <!--<button @click="createWindow('index.html')">打开index界面</button>-->
</div>
    `

  })



});
