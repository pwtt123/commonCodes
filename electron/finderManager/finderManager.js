const { BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');

var _=require("underscore");

var chance=require("chance");

var FinderManager=function () {

    // 窗口对象
    var winList={};




  // 创建窗口
// xHTMLPath,HTML页面地址
//xUrlParameters{
// winID,页面ID, 默认为Guid()
//dataBoxName:资料库名称
// }
//  xCallBack(err),错误回调
    var startFinder=function(xOptions,xCallBack) {
        var zWin= new BrowserWindow({width: 1000, height: 800});

       var zWinID=new chance().guid();

      if(!xOptions["boxRootPath"])return xCallBack("boxRootPathNotFound");
       // console.log("dirname",__dirname)

        var zHtmlPath=path.join(__dirname,"./finder.html");
        var zUrl=url.format({
            pathname: zHtmlPath,
            protocol: 'file:',
            slashes: true
        });

        var zSuffix="?winID="+zWinID;


        zWin.loadURL(zUrl+zSuffix);

        winList[zWinID]=xOptions?xOptions:{};
        winList[zWinID]["window"]=zWin;


        if(xOptions.ifOpenDevTools) zWin.webContents.openDevTools();

        // 当 window 被关闭，这个事件会被触发。
        zWin.on('closed', () => {
            // 取消引用 window 对象，如果你的应用支持多窗口的话，
            // 通常会把多个 window 对象存放在一个数组里面，
            // 与此同时，你应该删除相应的元素。
            zWin = null;
            delete winList[zWinID]
        });

    };

    //获取window对象
    var getFinder=function (xWinID) {
        return winList[xWinID]
    };


    this.getFinder=getFinder;
    this.startFinder=startFinder;

};

module.exports =FinderManager;