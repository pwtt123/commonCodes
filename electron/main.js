const {ipcMain,app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');

var fs = require('fs');
var _= require("underscore");


//引入 FinderManager 和 FileCacheManager
var FileCacheManager=require("./mod/fileCacheManager/fileCacheManager.js");
var FinderManager=require("./mod/finderManager/finderManager.js");

// 初始化 FinderManager 和 FileCacheManager 实例，并作为global属性，可全局访问
global.finderManager=new FinderManager();

global.fileCacheManager =new FileCacheManager();













// 创建窗口
function createWindow(xHTMLPath,xWindowID,xDataBoxPath) {
  var zWin= new BrowserWindow({width: 1000, height: 800});
  if(!xWindowID) return ;
  var zUrl=url.format({
      pathname: path.join(__dirname, xHTMLPath),
      protocol: 'file:',
      slashes: true
    })+"?winID="+xWindowID;


  if(xDataBoxPath)zUrl+="&dataBox="+xDataBoxPath;

  // if(xDataBoxPath)zUrl=zUrl+"&dataBoxPath="+xDataBoxPath;

  zWin.loadURL(zUrl);

  windowManager[xWindowID]=zWin;

  zWin.webContents.openDevTools();

  // 当 window 被关闭，这个事件会被触发。
  zWin.on('closed', () => {
    // 取消引用 window 对象，如果你的应用支持多窗口的话，
    // 通常会把多个 window 对象存放在一个数组里面，
    // 与此同时，你应该删除相应的元素。
    zWin = null;
    delete windowManager[xWindowID]
  });

}







// 保持一个对于 window 对象的全局引用，如果你不这样做，
// 当 JavaScript 对象被垃圾回收， window 会被自动地关闭
let win;
//开发者工具



function createMainWindow () {
    // 创建浏览器窗口。
    win = new BrowserWindow({width: 1600, height: 1000});


    // 加载应用的 index.html。
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'dataBoxTest.html'),
        protocol: 'file:',
        slashes: true
    }));

    // 打开开发者工具。
    win.webContents.openDevTools();

    // 当 window 被关闭，这个事件会被触发。
    win.on('closed', () => {
        // 取消引用 window 对象，如果你的应用支持多窗口的话，
        // 通常会把多个 window 对象存放在一个数组里面，
        // 与此同时，你应该删除相应的元素。
        win = null
    })


}

// Electron 会在初始化后并准备
// 创建浏览器窗口时，调用这个函数。
// 部分 API 在 ready 事件触发后才能使用。
app.on('ready', function () {

  createMainWindow();
});

// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
    // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
    // 否则绝大部分应用及其菜单栏会保持激活。
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // 在这文件，你可以续写应用剩下主进程代码。
    // 也可以拆分成几个文件，然后用 require 导入。
    if (win === null) {
      createMainWindow()
    }
})