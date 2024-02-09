var {remote} = require('electron');
// var fileCacheList = remote.getGlobal('fileCacheList');

var finderManager= remote.getGlobal('finderManager');
var fileCacheManager= remote.getGlobal('fileCacheManager');

// console.log("fileCacheManager",fileCacheManager)
var Thenjs = require("Thenjs");
var path = require("path");
const {shell} = require('electron');
var json2csv = require('json2csv');
var iconv = require('iconv-lite');
var fs=require("fs");
const {dialog} = require('electron').remote
var XLSX = require('xlsx');



// 点击替换成连接的按钮
function clickReplacedLink(xReplacedString) {
  console.log("clickReplacedLink",xReplacedString)
  var zReplacedObj= queryCache.replacedLinkList[xReplacedString]
  console.log("zReplacedObj",zReplacedObj)
}



var testTable;


var queryCache;
$(function () {

  queryCache = new Vue({
    el: "#queryCache",
    mounted: function () {

     var zWinID=urlQueryString("winID");
     this.winObj=finderManager.getFinder(zWinID);
     // console.log(" this.winObj", this.winObj);
     this.fileCacheObj=fileCacheManager.getDataBox(this.winObj.boxRootPath);
      // console.log(" this.fileCacheObj", this.fileCacheObj);

      this.setSuperTagLinkList(this.winObj.superTags);
     this.setRelatedBoxLinkList(this.fileCacheObj.relatedBoxList);

      this.enterKeywordInput();
    },
    data: {
      ////是否显示 载入中图标
      isLoading:0,
      //搜索关键字
      keyword: "",

      //查询结果是否超过上限
      isMaxLimitNumExceed:0,
      //分页相关
      pagination: {
        pageRecsNum: 40,
        pageNum: 1,

        //总页数
        totalPageNum: 0,
        //总记录数
        totalRecNum: 0,
      },

      //此finder页面 的win 对象，包括 BrowserWindow实例 和筛选条件
      //{keyword，"xxx|yyy^zz"
      // filePathList，["C://full/test.txt","C://full/test.xlsx"]
      // supperTags:{}
  // }
      winObj:{},

      fileCacheObj:{},

      //数据库数据,DBType 作为key，对应查到的数据做为内容
      //{text:[]
      // table:[],...
      // }
      dbData: {
        table: [],
        text: [],
      },


      //记录表格中每一列的宽度（有此列中最大宽度的字符串决定）
      //{<dbType>:{
      //           <tableName>:{<列号，0/1/2/...>:<最小宽度，由此列最长的字符串长度决定>,
      //                        1:40
      //                        }
      //          }
      // }
      columnWidthList: {
        table: {},
        text: {}
      },

      //数据库类型
      //"text"/"table"
      DBType: "table",


      //排序字段
      filed4Sort: {
        header: 1,
        //关于row中 下标 的排序
        rowIndex2Sort: 'fullPath',
        //row 下标排序对应的 方向,1/-1
        rowSortDirection: 1
      },



      //文件路径集合,若 有值，则增加筛选条件，fullPath:{$in:此集合}
      filePathList: [],

      //所有header的筛选条件列表
      //{
      // 价格:[{type:"$lt",value:"4"},{type:"$regex",value:"aaa"}...]
      // }
      headerFilterList: {},

      //所有header 对应的 标签列表
      //{<header名>:{checkedKeys:[0,1],tags:["腾讯新闻","网易科技"],...}
      headerCheckBoxOptionList: {},


      //标签筛选框内容
      offCanvasTagsInputFilter: "",

      //正在使用的 筛选keyword
      searchingKeywordRegex:"",

      //正在筛选的标题列表
      searchingHeaderList:{},

      
      //超级标签 筛选
      superTagRegex:"",


      // 每列 需替换的 可生成正则的字符串，通过  new RegExp 此字符串可直接生成 正则表达式，
      // 列头 作为key,可生成正则的字符串作为value
      // 其中 $$All，属性下的内容 为每列都需替换的内容,若 某列头属性不存在，则使用 $$All 下的字符串
      // 若 存在列头属性，则使用 $$All.value+"|"+<header>.value，作为生成正则的字符串
      // 维护时，需先生成$All下的字符串，再 生成每个列头下，去除掉 在$All下的 字符串，
      //{
      // $All:"张三|李四|...",
      // 联系人:"王五|赵6...",
      // ...
      // }

      rowRegexStringList:{},

      //所有已替换的链接的属性对照表，方便原生click事件使用
      //"张三":{ 被替换的字符串
      // superTags: 若为超级标签，保存超级标签的信息(详见 startFinder 的参数 xOptions.superTags)
      // relatedBoxList: 若为关联数据库，保存关联数据库的信息 (详见 fileCacheManager.addDataBox 的参数，xDataBox.relatedBoxList),
      // }
      replacedLinkList:{},

      // 设定的参数
      settings: {
        //根据字符串计算宽度扩大的倍数
        string2WidthTimes: 7,
        //最大列宽
        maxColWidth: 600,
        //最小列宽
        minColWidth: 20,

        //最大显示标签数
        offcanvasTagsMaxNum: 15,
        //每个标签最大显示字数
        offcanvasTagMaxLength: 15,


      },

    },
    methods: {
      //点击 fullPath打开对应文件
      clickTableFullPath: function (xFilePath) {
        // console.log("zFileFullPath",zFileFullPath);
        shell.openItem(xFilePath)
      },
      //keyword 输入框  按下确认
      enterKeywordInput: function (xIfNotResetPageNum) {
        //
        if(xIfNotResetPageNum!=1) {
          this.pagination.pageNum = 1;
        }
        this.reduceTotalRecsNum();
        this.queryDataFromDB();
      },

      //切换数据库类型 的 radio
      clickDBTypeRadio: function (xDBType) {
        if(xDBType)this.DBType=xDBType;
        this.keyword = "";
        this.enterKeywordInput();
      },

      //点击 table表标题,用来排序
      clickTableHeader: function (xHeaderIndex) {
        //若已有此字段排序
        if (xHeaderIndex == this.filed4Sort["rowIndex2Sort"]) {
          // 方向 取反
          this.filed4Sort["rowSortDirection"] = 0 - this.filed4Sort["rowSortDirection"];
        }
        //否则切换字段排序
        else {
          this.filed4Sort["rowSortDirection"] = 1;
          this.filed4Sort["rowIndex2Sort"] = xHeaderIndex;
        }

        this.queryDataFromDB();

      },


      // 把表格类的数据,按照 header 分组
      groupDataByHeader: function (xTable) {
        var zThis=this;
        var zDBType=this.DBType;
        var zReturnData;
        // 根据 header分组
        zReturnData = _.groupBy(xTable, function (xRec) {
          return xRec["header"]
        });

        // console.log("zReturnData",zReturnData)


        //如有未定义 列的,替换成 第1列,第2列...
        if (zReturnData["undefined"]) {
          var zNullHeader = "";
          // 若为 table表,根据最大列,生成 第1列,第二列..
          if (this.DBType == "table") {
            var zNullHeaderLength = _.reduce(zReturnData["undefined"], function (memo, xRowObj) {
                if (xRowObj['row'].length > memo) return xRowObj['row'].length;
                else return memo
              }, 0
            );

            for (var i = 1; i <= zNullHeaderLength; i++) {
              zNullHeader += "第" + i + "列,";
            }
            zNullHeader = zNullHeader.substr(0, zNullHeader.length - 1);

            // _.extend(zReturnData[zNullHeader],);

          }
          //若为 文本类
          else if (this.DBType == "text") {
            zNullHeader = "内容"
          }


          zReturnData[zNullHeader] = [];
          //把 undefined中的数据放到 zNullHeader 中
          _.each(zReturnData["undefined"], function (xRowObj, xIndex) {
            // console.log("xRowObj",xRowObj);
            xRowObj["header"] = zNullHeader;
            zReturnData[zNullHeader].push(xRowObj)
          });
          //删除 undefined中的数据
          delete zReturnData["undefined"]
        }

        // 处理 每个单元格的数据后，在返回
        return  zThis.handelEachCellDataFromDBData(zReturnData);

      },

      // 循环所有单元格数据，替换链接，格式等，并计算出 每列的最小宽度
      //xDataGroupedByHeader:根据header分组后的数据
      handelEachCellDataFromDBData:function (xDataGroupedByHeader) {


        var zThis=this;
        var zDBType=this.DBType;

        // console.log("setColumnWidthListFromCell",JSON.stringify(zThis.columnWidthList))

        // 处理每个 header分组的 表格,设置最小列宽
        _.each(xDataGroupedByHeader,function (xTableObj,xHeaderListString) {
          if (!zThis.columnWidthList[zDBType][xHeaderListString]) zThis.columnWidthList[zDBType][xHeaderListString] = {
            fullPath:8*zThis.settings.string2WidthTimes+21,
            mtime:8*zThis.settings.string2WidthTimes+21,
            sheetName:7*zThis.settings.string2WidthTimes+21,
          };

          //列名集合
          var zHeaderList=[];
          // 循环每个标题，设置最低列宽
          _.each(xHeaderListString.split(","),function (xHeader,xIndex) {
              zHeaderList.push(xHeader);
            zThis.setColumnWidthListFromCell(xHeader, xHeaderListString, xIndex);
          });


          
          // 处理每一行数据
          _.each(xTableObj,function (xRowObj,xRowIndex) {
            // console.log("row",xRowObj,xRowIndex);
            var zFileName=zThis.getBaseName(xRowObj["fullPath"]).substr(3);
            zThis.setColumnWidthListFromCell(zFileName, xHeaderListString, "fullPath");


            var zMtime=zThis.filterDate(xRowObj["mtime"]);
            //计算列宽
            zThis.setColumnWidthListFromCell(zMtime, xHeaderListString, "mtime");
            //替换文本内容
            xDataGroupedByHeader[xHeaderListString][xRowIndex]["mtime"]=zMtime;

            //计算列宽
            zThis.setColumnWidthListFromCell(xRowObj["sheetName"], xHeaderListString, "sheetName");



            //文本类数据，处理content
            if(zDBType=="text"){
              //设置列宽
              zThis.setColumnWidthListFromCell(xRowObj["content"], xHeaderListString, 0);

              xDataGroupedByHeader[xHeaderListString][xRowIndex]["content"]=zThis.replaceLink(xRowObj["content"]);

              // console.log(zThis.replaceLink(xRowObj["content"]))

            }
            // 表格类数据，处理每个单元格
            if(zDBType=="table"){
            // console.log(xRowObj["row"])
              var zNewRow=[];
              _.each(xRowObj["row"],function (xValue,xColIndex) {

                //设置列宽
                zThis.setColumnWidthListFromCell(xValue, xHeaderListString, xColIndex);

               // 时间类型格式化
               var zDateTest=/[0-9]{4}\-[0-9]{2}\-[0-9]{2}T[0-9]{2}\:[0-9]{2}\:[0-9]{2}\.[0-9]{3}Z/g;
                if( zDateTest.test(xValue)){
                  xValue=xValue.replace(zDateTest,function (v) {
                    return new Date(v).format("yyyy-MM-dd hh:mm:ss")
                  });
                }
                zNewRow[xColIndex]=zThis.replaceLink(xValue,zHeaderList[xColIndex])

              });

              xDataGroupedByHeader[xHeaderListString][xRowIndex]["row"]=zNewRow;
            }


          })

        });


        // console.log("setColumnWidthListFromCell",zThis.columnWidthList)

        return xDataGroupedByHeader
      },

      //获取 数据库查询的筛选条件
      getFilters: function () {
        var zThis = this;

        var zDbFindComObj = {$and: []};

        if (this.winObj.filePathList && this.winObj.filePathList.length) {
          zDbFindComObj["fullPath"] = {$in: this.winObj.filePathList}
        };

        //当 筛选table表时
        if (this.DBType == "table") {
          //处理每个 header下的标签
          _.each(this.headerCheckBoxOptionList, function (xHeaderTags, xHeaderName) {

            var z$or = [];
            //处理每个选中的标签
            _.each(xHeaderTags["checkedKeys"], function (xCheckedIndex) {
              //每个选中的标签作为$or的条件
              z$or.push({["record." + xHeaderName]: xHeaderTags["tags"][xCheckedIndex]})
            });

            //每个header下的标签筛选 ，作为$and的条件
            if (z$or.length) zDbFindComObj["$and"].push({$or: z$or})
          });

        }


        return zDbFindComObj;

      },
      //获取，limit,skip,sort等信息
      getFilterOptions: function () {

        //根据 页数和每页记录数，决定 skip和limit参数
        var zSkip = (this.pagination.pageNum - 1) * this.pagination.pageRecsNum;
        var zLimit = this.pagination.pageRecsNum;

        var zDbFindOptions = {"skip": zSkip, "limit": zLimit};

          //排序 字段
          if (!zDbFindOptions.sort) zDbFindOptions.sort = {};
          _.extend(zDbFindOptions.sort, _.pick(this.filed4Sort, "header"));

          // 把 row 中的属性 提取出来,放到 排序条件中
          zDbFindOptions.sort[this.filed4Sort.rowIndex2Sort] = this.filed4Sort.rowSortDirection;

        //关键字查询,为传进来的 关键字^当前关键字
          var zKeyword="";
          if(this.winObj.keyword)zKeyword+=("^"+this.winObj.keyword);

          if (this.keyword ) zKeyword+=("^"+this.keyword);
           zKeyword=zKeyword.substr(1);
           zKeyword=zKeyword.replace(/(\s)+/g,"|");
          if(zKeyword) zDbFindOptions.keyword = zKeyword;


        //传数据库类型
        zDbFindOptions.DBType = this.DBType;


        return zDbFindOptions;
      },

      //设置 筛选 条件 和 option
      setFiltersAndOptions: function (xSourceFilter, xSourceOptions) {
        //设置不带列头筛选条件的 初始筛选条件
        _.extend(xSourceFilter, this.getFilters());
        _.extend(xSourceOptions, this.getFilterOptions());

        if (!xSourceFilter["$and"]) xSourceFilter["$and"] = [];

        // table表 header的筛选条件
        if(this.DBType=="table"){

          // header的 关键字匹配
          if (!xSourceOptions["headerKeywordList"]) xSourceOptions["headerKeywordList"] = {};
          //设置列头筛选条件
          //处理每个 header
          _.each(this.headerFilterList, function (xHeaderFilters, xHeader) {

            //处理 header的 每个筛选条件
            _.each(xHeaderFilters, function (xxFilter) {


              // 当 使用$regex时，条件放在 options中 后台解析成正则
              if (xxFilter["type"] == "$regex" && xxFilter["value"]) {
                //不存在这个字段的模糊查询，增加keyword
                if (!xSourceOptions["headerKeywordList"][xHeader]) xSourceOptions["headerKeywordList"][xHeader] = xxFilter["value"];
                else {
                  //已存在，作为并集条件 增加 keyword
                  xSourceOptions["headerKeywordList"][xHeader] += ("^" + xxFilter["value"]);
                }

              }
              // 相等，neDB不支持 $eq
              else if (xxFilter["type"] == "$eq" && xxFilter["value"]) {

                //若检测到 筛选条件为纯数字，转换为数字
                if (/^[0-9]*$/.test(xxFilter["value"])) {
                  xxFilter["value"] = Number(xxFilter["value"]);
                }

                xSourceFilter["$and"].push({["record." + xHeader]: xxFilter["value"]})
              }
              //标签 不进行处理 (在 getFilter中处理过了)
              else if (xxFilter["type"] == "$tag") {

              }
              // 其他条件，直接放到 filters 中
              else {

                //若检测到 筛选条件为纯数字，转换为数字
                if (xxFilter["value"] && /^[0-9]*$/.test(xxFilter["value"])) {
                  xxFilter["value"] = Number(xxFilter["value"]);
                }

                if (xxFilter["type"] && xxFilter["value"]) {
                  xSourceFilter["$and"].push({["record." + xHeader]: {[xxFilter["type"]]: xxFilter["value"]}})
                }
              }

            })
          });
        }




      },


      //统计总记录数
      reduceTotalRecsNum: function () {
        var zThis = this;

        var zDbFilters = {};
        var zDbFilterOptions = {};

        this.setFiltersAndOptions(zDbFilters, zDbFilterOptions);

        zDbFilterOptions.count = 1;
        fileCacheManager.queryFileCache(this.winObj.boxRootPath,zDbFilters, zDbFilterOptions, function (err, xNum) {
          if(err=="maxLimitNumExceed"){
            zThis.isMaxLimitNumExceed=1;
          }else{
            zThis.isMaxLimitNumExceed=0;
          }

          if(zThis.handelErr(err)) return;

          zThis.pagination.totalRecNum = xNum;
          // 向上取整
          var zTotalPageNum = Math.ceil(xNum / zThis.pagination.pageRecsNum);
          //console.log(zTotalPageNum);
          zThis.pagination.totalPageNum = zTotalPageNum

        })
      },

      //查询 符合条件的记录
      queryDataFromDB: function () {
        var zThis = this;
        var zDbFilters = {};
        var zDbFilterOptions = {};
        var zDBType = zThis.DBType;
        this.setFiltersAndOptions(zDbFilters, zDbFilterOptions);


        // console.log("zDbFilterOptions",zDbFilterOptions)


          //若查找了关键字，生成关键字匹配正则
          if(zDbFilterOptions.keyword){
            var zKeywordRegex=zDbFilterOptions.keyword.replace(/\^/g,"|");
            zThis.searchingKeywordRegex=new RegExp(zKeywordRegex,"gi");
          }
          //否则，正则置为空
          else{
            zThis.searchingKeywordRegex=""
          }

        // console.log(zThis.searchingKeywordRegex)

          //若 执行查询时，有列头条件，则增加到 列头的正在查询列表中
          _.each(this.headerFilterList,function (xFilters,xHeader) {
              if(xFilters) zThis.searchingHeaderList[xHeader]=xFilters.length
          });


        this.isLoading=1;
        zThis.dbData[zDBType]=[];
        fileCacheManager.queryFileCache(this.winObj.boxRootPath,zDbFilters, zDbFilterOptions, function (err, xDocs) {
         if(zThis.handelErr(err))return;
          // console.log("xDocs",xDocs);


          //初始化列宽
          zThis.setupColumnWidthList();

          // 按照 header分组,无header会特殊处理
          var zDocs = zThis.groupDataByHeader(xDocs);

          zThis.dbData[zDBType] = zDocs;
          zThis.isLoading=0;

        })
      },

      //更改页数
      changePageNum: function (xNum, xType) {
        if (xNum) this.pagination.pageNum = xNum;
        if (xType == "previous") this.pagination.pageNum -= 1;
        if (xType == "next") this.pagination.pageNum += 1;
        this.reduceTotalRecsNum();
        this.queryDataFromDB();
      },



      //替换链接
      //  xValue:单元格中内容
      //  xHeader: 此列列头 名称
      replaceLink: function (xValue,xHeader) {
        var zDBType=this.DBType;

        var zValue=(xValue?xValue:"").toString();
        // 替换 html 标签，防止 v-html 出错
        zValue = this.html2Escape(zValue);


        //返回的处理过的字符串
        var zReturnValue = zValue;

        //表格类型，检测到http(s)://开头的字符,整个文本替换为链接
        if (zDBType == "table") {
          var zLinkRegex = /^(http(s)?:\/\/)/;
          if (zLinkRegex.test(zValue)) {
            zReturnValue = "<a target='_blank' href='" + zValue + "'>" + zValue + "</a>";
            return zReturnValue
          }
        }



          // 替换的文本集合
          var zReplaceStringArray=[];
          _.each(this.rowRegexStringList,function (xStringList,xRegexHeader) {
            //此列与$$All的交集
            if(xHeader==xRegexHeader)zReplaceStringArray=xStringList
          });
          _.each(zReplaceStringArray,function (xReplaceString) {
             if(xReplaceString==zValue) zReturnValue=""
          });


          // 超级标签替换成可打开文件的链接
          if(this.superTagRegex){

              var zSuperTagRegex=this.superTagRegex;

              zReturnValue= zReturnValue.replace(zSuperTagRegex,function(c){ return "<a class='uk-link'  onclick= clickReplacedLink($(this).html()) >"+c+"</a>";})
          }


        // 筛选文字高亮显示
        if(this.searchingKeywordRegex){
          var zKeywordRegex=this.searchingKeywordRegex;
          // console.log("zKeywordRegex",zKeywordRegex)
          zReturnValue=zReturnValue.replace(zKeywordRegex,function(c){ return "<span class='text-searched'>"+c+"</span>";})
        }




        return zReturnValue
      },

      //根据每个单元格设置列的宽度，若改变了列宽就刷新页面
      setColumnWidthListFromCell: function (xValue, xHeaderListString, xColIndex) {
        var zDBType=this.DBType;
        if (!this.columnWidthList[zDBType][xHeaderListString]) this.columnWidthList[zDBType][xHeaderListString] = {};
        if (!this.columnWidthList[zDBType][xHeaderListString][xColIndex]) this.columnWidthList[zDBType][xHeaderListString][xColIndex] = this.settings.minColWidth;

        var zValue=iconv.encode(xValue, 'gbk');

        var zThisCellWidth = zValue.length * this.settings.string2WidthTimes;

        //最大行数
        var zMaxWidth = this.settings.maxColWidth;

        if (zThisCellWidth > zMaxWidth) zThisCellWidth = zMaxWidth;

        if (this.columnWidthList[zDBType][xHeaderListString][xColIndex] < zThisCellWidth) {
          this.columnWidthList[zDBType][xHeaderListString][xColIndex] = zThisCellWidth;

        }

      },

      // 初始化，表格列的宽度列表
      setupColumnWidthList: function () {
        var zThis = this;
          var zDBType=this.DBType;
          delete zThis.columnWidthList[zDBType];
          zThis.columnWidthList[zDBType] = {};

        this.refresh();
      },


      // 点击打开 抽屉窗口
      clickOpenOffCanvas: function () {
        this.getAllHeaders()
      },

      //获取表格类文件所有的header
      getAllHeaders: function () {
        var zThis = this;

        // 获取列头 的查询条件，不包含列头本身的查询和分页，包含初始的查询条件
        var zDbFilters = this.getFilters();
        var zDbFilterOptions = this.getFilterOptions();

        //需要查询所有记录， 去除筛选条件中的 分页相关
        delete zDbFilterOptions.skip;
        delete zDbFilterOptions.limit;

        // 取得所有 存在标题的 字段,并且只返回 标题字段
        _.extend(zDbFilters, {header: {$exists: true}});
        _.extend(zDbFilterOptions, {projections: {header: 1}});

        fileCacheManager.queryFileCache(this.winObj.boxRootPath,zDbFilters, zDbFilterOptions, function (err, xDocs) {
          if (zThis.handelErr(err)) return ;
          // console.log("dbData", xDocs);

          //循环 每个 header,去重后生成 所有header列表
          _.each(xDocs, function (xDoc) {
            var zHeaders = xDoc["header"].split(",");

            _.each(zHeaders, function (xxHeader) {

              if (!zThis.headerFilterList[xxHeader]) zThis.$set(zThis.headerFilterList, xxHeader, [])
            })

          });


        })
      },

      // 返回 标签的 筛选条件，再条件集合中的下标，不存在，返回-1
      get$tagFilterIndex: function (xHeaderFilter) {
        var zRegexIndex = -1;

        _.each(xHeaderFilter, function (xFilterObj, xIndex) {
          if (xFilterObj["type"] == "$tag") zRegexIndex = xIndex;
        });

        return zRegexIndex
      },

      //获取 筛选过后的 tags
      getFilteredTags: function (xTags, xHeaderFilter) {
        var zThis = this;
        var zReturnTags = {};
        // console.log("xValue",xHeaderFilter)

        var zNum = 0;
        var zMaxNum = this.settings.offcanvasTagsMaxNum;
        var zMaxLength = this.settings.offcanvasTagMaxLength;

        _.each(xTags, function (xTag, xIndex) {
          zNum++;
          if (zNum > zMaxNum)return;

          var zValue = zThis.offCanvasTagsInputFilter.toLowerCase();
          //若存在标签筛选，只显示筛选的标签
          if (zValue) {
            if (xTag.toString().toLowerCase().indexOf(zValue) == -1) return;
          }
          xTag=xTag.toString();
          // 若超过最大长度，增加 "..."
          var ifNotEnd = !!xTag.substr(zMaxLength);
          //截取最大长度
          zReturnTags[xIndex] = xTag.substr(0, zMaxLength);
          if (ifNotEnd) zReturnTags[xIndex] += "..."
        });

        return zReturnTags
      },

      //点击 抽屉中的 header
      clickOffcanvasHeader: function (xHeader) {
        this.getTagsByHeader(xHeader);

        this.offCanvasTagsInputFilter = ""

      },

      //通过 列头，查询数据库中所有 header对应的字段，去重后生成标签信息
      getTagsByHeader: function (xHeader) {
        var zThis = this;

        // 获取标签的 查询条件，除了分页，和数据的查询条件一致，
        var zDbFilters = {};
        var zDbFilterOptions = {};

        this.setFiltersAndOptions(zDbFilters, zDbFilterOptions);

        //需要查询所有记录， 去除筛选条件中的 分页相关
        delete zDbFilterOptions.skip;
        delete zDbFilterOptions.limit;


        // 取得所有 此字段下的数据
        _.extend(zDbFilters, {["record." + xHeader]: {$exists: true}});
        _.extend(zDbFilterOptions, {projections: {["record." + xHeader]: 1}});

        //查询数据库
        fileCacheManager.queryFileCache(this.winObj.boxRootPath,zDbFilters, zDbFilterOptions, function (err, xDocs) {
          if (zThis.handelErr(err)) return ;
          // console.log("dbData", xDocs);
          var zTags = _.map(xDocs, function (xDoc) {
            return xDoc["record"][xHeader]
          });
          //去重
          zTags = _.union(zTags);
          //去掉空值
          zTags = _.compact(zTags);
          //若没有此字段的，直接 赋值
          if (!zThis.headerCheckBoxOptionList[xHeader]) {

            zThis.headerCheckBoxOptionList[xHeader] = {"tags": zTags, "checkedKeys": []};
          }
          //有此字段，取不同的值,增加到原数组中
          else {
            var zDifferenceTags = _.difference(zTags, zThis.headerCheckBoxOptionList[xHeader]["tags"]);
            _.each(zDifferenceTags, function (xTag) {
              zThis.headerCheckBoxOptionList[xHeader]["tags"].push(xTag)
            })
          }

        });
      },

      //点击增加 抽屉 中 某个字段的筛选条件
      clickOffCanvasAddFilterIcon: function (xHeaderObj) {

        xHeaderObj.push({type: "$regex", value: ""})
      },

      //删除 某个字段的筛选条件
      clickOffCanvasDeleteFilterIcon: function (xHeaderObj, xHeaderIndex, xHeader) {
        // console.log("delete",xHeader,this.headerCheckBoxOptionList[xHeader]);
        // 若删除标签类，去除所有已选中项
        if (xHeaderObj[xHeaderIndex] && xHeaderObj[xHeaderIndex]["type"] == "$tag") {
          if (this.headerCheckBoxOptionList[xHeader]) clearArray(this.headerCheckBoxOptionList[xHeader]["checkedKeys"])
        }

        xHeaderObj.splice(xHeaderIndex, 1)
      },

      // 点击标签事件
      clickOffCanvasTag: function (xTags, xHeaderObj) {

        // console.log(xTags,xHeaderObj);

        var zTagFilterIndex = this.get$tagFilterIndex(xHeaderObj);

        var zTagInputValue = "";
        //根据 选中的标签，增加到数据到 标签 文本框中
        _.each(xTags["checkedKeys"], function (xCheckedIndex) {
          if (xTags["tags"][xCheckedIndex]) zTagInputValue += ("," + xTags["tags"][xCheckedIndex].toString())
        });


        // console.log("zTagFilterIndex",zTagFilterIndex);
        xHeaderObj[zTagFilterIndex].value = zTagInputValue.substr(1);


        this.refresh();

        //获取数据
        // this.enterKeywordInput();
      },

      //点击 清空所有筛选条件按钮
      clickOffcanvasClearFiltersBtn: function () {
        var zThis = this;
        //清空 筛选条件
        _.each(this.headerFilterList, function (xHeaderFilters, xHeader) {
          clearArray(xHeaderFilters)
        });

        //  清空标签筛选
        _.each(this.headerCheckBoxOptionList, function (xTagObj) {
          clearArray(xTagObj["checkedKeys"])
        });

        this.enterKeywordInput();

        //
        UIkit.offcanvas("#offcanvas").hide();
      },

      //点击开始搜索按钮
      clickOffcanvasStartSearchBtn:function () {
        this.enterKeywordInput();
        UIkit.offcanvas("#offcanvas").hide();
      },

      //点击导出表格功能
      clickExportTableButton:function () {
        var zThis = this;
        var zDbFilters = {};
        var zDbFilterOptions = {};
        var zDBType = zThis.DBType;
        //当前查询条件 去除分页条件
        this.setFiltersAndOptions(zDbFilters, zDbFilterOptions);
        delete zDbFilterOptions.skip;
        delete zDbFilterOptions.limit;

        //获取所有数据
        fileCacheManager.queryFileCache(this.winObj.boxRootPath,zDbFilters, zDbFilterOptions, function (err, xDocs) {
          if (zThis.handelErr(err)) return ;

          // 按照 header分组,无header会特殊处理.
          var zDocs = zThis.groupDataByHeader(xDocs);
          // console.log("AllData", zDocs);
          zThis.exportGroupedDBData2Csv(zDocs)
        })
      },

      //处理 分组后的数据库数据, 并且导出csv,
      exportGroupedDBData2Csv:function (xGroupedDBData) {
        var zThis=this;
        var zField;

        if(this.DBType=="table")zField="row";
        if(this.DBType=="text")zField="content";

        var wb = XLSX.utils.book_new();

        var zSheetNum=0;
        //文件名 日期后缀
        var zDateSuffix=new Date().format("yyyyMMddhhmmssS");
        //临时文件路径
        var zCenterPath=chance.guid()+".xlsx";



        //处理每个不同表格的数据，放在不同的sheet中
        _.each(xGroupedDBData,function (xDocs,xHeaderName) {
          zSheetNum++;
          //取需要的字段
          var zDocs=_.map(xDocs,function (xRowObj) {
            // console.log("xRowObj",xRowObj["row"])
            //文本类型 返回成数组格式
            if(zThis.DBType=="text")return [xRowObj[zField]];
            else return xRowObj[zField]
          });

          // var zCSVData2Save=json2csv({data:zDocs});

          //此sheet的列头
          var zHeaderList=xHeaderName.split(",");
          //放到 数组的第一个元素
          zDocs.unshift(zHeaderList);

          var ws = XLSX.utils.aoa_to_sheet(zDocs);
          /* add worksheet to workbook */
          XLSX.utils.book_append_sheet(wb, ws, "Sheet"+zSheetNum);

        });

        //生成临时文件
        XLSX.writeFile(wb, zCenterPath);

        //打开win窗口，获取用户选择的路径
        dialog.showSaveDialog(zThis.winObj.window,{},function (xFilePath) {
          // console.log("xFilePath",xFilePath);
          //不存在，删除临时文件
          if(!xFilePath){
            return fs.unlink(zCenterPath,function (err) {if(err)console.log(err)})
          };
          //存在，则移动临时文件
          fs.rename(zCenterPath, xFilePath, function (err) {
            if(err) return console.log(err);
              UIkit.modal.alert("保存成功!")
          })
        })

      },

      //刷新
      refresh: function () {
        this.$forceUpdate();
      },

      //根据日期返回 N 分钟/小时/天/... 前 的字符
      filterDate:function (xDate) {
        var time =new Date()-new Date(xDate);

        time=time/1000;

        if (time > 0 && time < 3600) {
          return  Math.ceil(time / 60) + "分钟前";
        } else if (time >= 3600 && time < 3600 * 24) {
          return  Math.ceil(time / 3600) + "小时前";
        } else if (time >= 3600 * 24 && time < 3600 * 24 * 30) {
          return  Math.ceil(time / 3600 / 24) + "天前";
        } else if (time >= 3600 * 24 * 30 && time < 3600 * 24 * 30 * 12) {
          return  Math.ceil(time / 3600 / 24 / 30) + "个月前";
        } else if (time >= 3600 * 24 * 30 * 12) {
          return  Math.ceil(time / 3600 / 24 / 30 / 12) + "年前";
        } else {
          return "刚刚";
        }

      },
      //把文件全路径 返回 basename
      getBaseName: function (xValue) {
        var zBaseName=path.basename(xValue);
        var zIndexOf=zBaseName.lastIndexOf(".");

        if(zIndexOf<=0) return zBaseName.split("#")[0];

        var zSuffix=zBaseName.substr(zIndexOf);
         zBaseName=zBaseName.substr(0,zIndexOf).split("#")[0];
         // console.log("zBaseName",zBaseName)
        return zBaseName+"\n"+zSuffix
      },

      //生成 超级标签列表
      setSuperTagLinkList:function (xSuperTags) {
        var zThis=this;
        if(!xSuperTags)xSuperTags={};

        var zTagNames=_.map(xSuperTags,function (xTagObj) {
            return xTagObj["tagName"]
        });

          //根据超级标签生成 匹配的正则
          var zSuperTagRegexSting="";
          _.each(xSuperTags,function (xSuperTagObj) {
            if(!zThis.replacedLinkList[xSuperTagObj["tagName"]])zThis.replacedLinkList[xSuperTagObj["tagName"]]={};
            //把标签数据放到临时表中，方便 原生onclick事件 打开文件时使用
            zThis.replacedLinkList[xSuperTagObj["tagName"]]["superTags"]=xSuperTagObj;

            zSuperTagRegexSting+=("|("+xSuperTagObj["tagName"]+")")
          });
          zSuperTagRegexSting=zSuperTagRegexSting.substr(1);

          if(zSuperTagRegexSting)zThis.superTagRegex=new RegExp(zSuperTagRegexSting);
          else zThis.superTagRegex="";

        zThis.rowRegexStringList["$All"]=zTagNames;


          // console.log("rowRegexStringList",zThis.rowRegexStringList);

      },


      // 根据关联数据库列表，生成 需替换字符 的 列表
      setRelatedBoxLinkList:function (xRelatedBoxList) {
          var zThis=this;
          if(!xRelatedBoxList)xRelatedBoxList={};
          // 清空 除 $$All 以外的所有 列
          _.each(zThis.rowRegexStringList,function (xStringList,xHeader) {
              if(xHeader !="$$All") delete zThis.rowRegexStringList[xHeader]
          });

          // todo 测试，待删除
          var zPath=path.join(__dirname,"../../","./testData2")
          var zDataBox={
              boxName:"data2",
              boxRootPath:zPath};
          fileCacheManager.addDataBox(zDataBox,function (err) {
              // console.log("addDataBox",err);
          });


        // console.log("setRelatedBoxLinkList",xRelatedBoxList);
        //  并行方法集合
          var zParallelFuncs=[];

        // 处理每个关联资料库
        _.each(xRelatedBoxList,function (xDBObj,xDBPath) {
            // 处理 关联资料库 中每个 需查询的字段
            _.each(xDBObj,function (xTargetFields,xSourceField) {

              var zFilters={["record." + xSourceField]: {$exists: true}};

              var zFilterOptions={
                DBType:"table",
              };
              // 一个方法
              var zFunc=function (cont) {
                  // 查询资料库的所有字段
                  fileCacheManager.queryFileCache(xDBPath,zFilters,zFilterOptions,function (err,xDocs) {
                      if(err) return cont(err);
                      var zValueArray=_.map(xDocs,function (xDoc) {
                          if(xDoc["record"]) return xDoc["record"][xSourceField]
                      });
                      zValueArray=_.union(zValueArray);
                      zValueArray=_.compact(zValueArray);
                      // 处理每个 目标列
                      _.each(xTargetFields,function (xTargetField) {
                          // 若此列不存在，
                          if(!zThis.rowRegexStringList[xTargetField]) zThis.rowRegexStringList[xTargetField]=zValueArray;
                          // 存在的话，取并集
                          else{
                              zThis.rowRegexStringList[xTargetField]=_.union( zThis.rowRegexStringList[xTargetField],zValueArray);
                          }
                      });
                      // console.log("zThis.rowRegexStringList",zThis.rowRegexStringList)
                      cont();
                  })
              };

                zParallelFuncs.push(zFunc)
            });


            Thenjs.parallelLimit(zParallelFuncs, 20)
                .then(function (cont,result) {
                    // console.log("result",result)
                    //准备好关联字符替换后， 重新替换链接
                    zThis.dbData[zThis.DBType] = zThis.handelEachCellDataFromDBData( zThis.dbData[zThis.DBType]);
                })
                .fail(function (cont,err) {
                    console.log("err:",err)
                })


        });

      },


       //把html 标签 转义掉
       html2Escape:function(sHtml) {
        return sHtml.replace(/[<>&"]/g,function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c];});
      },

      // 处理出错信息，若返回true,则 表明 程序需终止,若无返回，或返回false，程序继续执行
      //return true/null
      handelErr:function (err) {

        if(err)console.log("err:",err);

        if(err=="dataBoxNotFound" || err=="isFinderQueryOnly"){
          alert("无访问权限!");
          window.close();
          return true;
        }
      }

    },
    filters: {

    }


  })






});
