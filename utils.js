// ****** include scripts
//$("head").append('<script src="/js/myMessage.js" type="text/javascript"></script>');
var MSG_ERROR_RUNTIME00 = "发现异常，网络可能超时或者服务器正忙。";

// check browser properties
var myBrowser = {
    versions: function () {
        var u = navigator.userAgent, app = navigator.appVersion;
        return {         //移动终端浏览器版本信息
            trident: u.indexOf('Trident') > -1, //IE内核
            presto: u.indexOf('Presto') > -1, //opera内核
            webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核
            gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1, //火狐内核
            mobile: !!u.match(/AppleWebKit.*Mobile.*/), //是否为移动终端
            ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端
            android: u.indexOf('Android') > -1 || u.indexOf('Linux') > -1, //android终端或uc浏览器
            iPhone: u.indexOf('iPhone') > -1, //是否为iPhone或者QQHD浏览器
            iPad: u.indexOf('iPad') > -1, //是否iPad
            wechat: u.toLowerCase().indexOf('micromessenger') > -1, // 是否微信浏览器
            webApp: u.indexOf('Safari') == -1 //是否web应该程序，没有头部与底部
        };
    }(),
    language: (navigator.browserLanguage || navigator.language).toLowerCase()
};

//lert(JSON.stringify(myBrowser));

/*
 console.log("语言版本: "+myBrowser.language);
 console.log(" 是否为移动终端: "+myBrowser.versions.mobile);
 console.log(" ios终端: "+myBrowser.versions.ios);
 console.log(" android终端: "+myBrowser.versions.android);
 console.log(" 是否为iPhone: "+myBrowser.versions.iPhone);
 console.log(" 是否iPad: "+myBrowser.versions.iPad);
 console.log(navigator.userAgent);
 */


// ****** startup of the page
$(document).ready(function () {
    $('body').css('display', 'none');

    $('body').fadeIn(500);

    //setTimeout("gotoTop()", 200); // fix a issue :  browser cannot return the view of page to the top after page refresh

});

// ****** waiting dialog
function startWait() {
    showMsg(".lock-page");
    clearMsg('.wait-lite');
    clearMsg('.non-lock-page');
}

function startWaitLite(xSvcName) {
    showMsg(".wait-lite");
}

function endWait(xSvcName) {
    setTimeout(function () {
        showMsg(".non-lock-page");
        clearMsg(".lock-page");
        clearMsg(".wait-lite");
    }, 800);
}


// ****** show runtime error
function showRunTimeError() {
    if (!isRunTimeErrorFound) {
        alert(MSG_ERROR_RUNTIME00);
        isRunTimeErrorFound = true;
    }
}

// ****** show Bootstrap Popup Menu
// <span id="xxx_id"
// data-toggle="popover" title="Popover title" data-html="true/false" data-trigger="manual"
// ng-click="showMenu('#'+this.id)"
// data-content="..." </span>
var activeMenuSelector = "";
function showBSMenu(xElementSelector, xContentSelector, xScope) {
    activeMenuSelector = xElementSelector;

    setTimeout(function () {
        var isMenuVisible = $(xElementSelector).next('div.popover:visible').length;

        if (!isMenuVisible) {
            if (xContentSelector) {
                //onsole.log(xElementSelector + "," + xContentSelector);
                $(xElementSelector).popover("destroy");
                $(xElementSelector).popover(
                    {content: $(nz(xContentSelector)).html()}
                );
            }
            $(xElementSelector).popover("show");
        }

        // popup menu's enhanced events for touchable devices
        if (myBrowser.versions.mobile) {
            $('body').on('touchend', hideAllOtherBSMenu);
        } else {
            $('body').on('mouseup', hideAllOtherBSMenu);
        }
    }, 200);
}

function hideBSMenu(xElementSelector) {
    $(xElementSelector).popover("hide");
}

function hideAllOtherBSMenu(e) { // for body events only

    if (activeMenuSelector) {
        if (!$(activeMenuSelector).is(e.target) && $(activeMenuSelector).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
            $(activeMenuSelector).popover('hide');
        }
    }

    /*$('[data-toggle="popover"]').each(function () {
     //the 'is' for buttons that trigger popups
     //the 'has' for icons within a button that triggers a popup
     if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
     $(this).popover('hide');
     }
     });*/
}


// ****** show Bootstrap Modal dialog
function showBSModalDialog(xSelector) {
//    if (myBrowser.versions.mobile) {
//        $(".modal").removeClass("fade");
//    }
//    $(xSelector).modal({
//        keyboard: false
//    });
//    $(xSelector).modal("show");
}

function hideBSModalDialog(xSelector) {
//    if (myBrowser.versions.mobile) {
//        $(".modal").removeClass("fade");
//    }
//    $(xSelector).modal("hide");
//    clearErrorMsg();
}


// ****** goto
function gotoPage(pageName, xIsNewWindow) {
    if (xIsNewWindow) {
        window.open(pageName);
    }
    else {
        window.location = pageName;
    }
    //$("body").fadeOut(500,function () {window.location = pageName;});
    return false;
}

var objectNameforScroll = myBrowser.versions.mobile ? "body" : "html";
function gotoTop() {
    console.log("gotoTOp");
    $(objectNameforScroll).animate({scrollTop: 0}, 200).eq(0);
    //onsole.log(myBrowser);
}

function gotoDiv(selector) {
    //var divid = document.getElementById(id);
    //divid.style.display = 'block';
    //window.location = "#"+id;
    setTimeout(function () {
        //divid.scrollIntoView(true);
        //alert("to:"+$("#"+id).position().top);

        $(objectNameforScroll)
            .animate({scrollTop: $(selector).position().top}, 200)
            //.animate({scrollTop: $(selector).offset().top}, 200)
            .eq(0) // we want function to be called just once
        ;

    }, 200);
    return false;
}


var isRunTimeErrorFound = false;
var invalidElementSortNo_MAX = 999999;
var invalidElementSortNo = invalidElementSortNo_MAX;
var activeElementSelector = "";


// ********** message
function clearMsg(selector) {
    $(selector).removeClass("invisible").addClass("invisible");
}

//xTime:持续显示时间,ms单位，null。一直显示（默认）
function showMsg(selector, xTime) {

    var zIsShown = !$(selector).hasClass("invisible");

    if (!zIsShown) {
        $(selector).hide();
        $(selector).removeClass("invisible");
        $(selector).fadeIn();
    }


    if (xTime) {
        if (zIsShown) {
            setTimeout(function () {
                $(selector).fadeOut();
            }, xTime);
        }

        setTimeout(function () {
            clearMsg(selector);
        }, xTime + 1000);
    }

}

function showTempMsg(selector) {
    showMsg(selector, 5000);
}

function toggleDiv(selector) {
    if ($(selector).hasClass('invisible')) {
        showMsg(selector);
    }
    else {
        clearMsg(selector);
    }
}

// ********** from validation
function startFormValidation() {
    activeElementSelector = "";
    invalidElementSortNo = invalidElementSortNo_MAX;
    tempDomActiveID = "";
}

function isFormValidated() {
    return (invalidElementSortNo == invalidElementSortNo_MAX);
}

function setFormValidationHints(selectorMsg, selectorControl2Focus, sortNo) {
    showMsg(selectorMsg);
    //alert(selectorMsg);
    //onsole.log("invalidElementSortNo:"+invalidElementSortNo+" Validated:"+(invalidElementSortNo == invalidElementSortNo_MAX));

    if (invalidElementSortNo > sortNo) {
        activeElementSelector = selectorControl2Focus;
        invalidElementSortNo = sortNo;
    }
}

function setFormValidationFocus() {
    if (activeElementSelector != "") {
        //gotoDiv(activeElementSelector);
        $(activeElementSelector).focus();
        activeElementSelector = "";
    }
}

function setFormDefaultFocus(xElementID) {
    try {
        activeElementSelector = xElementID;
        $(xElementID).focus();
    } catch (err) {
    }
}

// **************** Common Functions

// get parameters from URL, xxx.html?key1=value&key2=value2
function urlQueryString(item) {
    var svalue = location.search.match(new RegExp("[\?\&]" + item + "=([^\&]*)(\&?)", "i"));
    return svalue ? svalue[1] : svalue;
}
Request = {
    QueryString: urlQueryString
};
//lert(Request.QueryString("key1")+"k1");


// if null then "" or def
function nz(s, def) {
    var zDef = def;
    if ((def === undefined) || (def === null)) {
        zDef = "";
    }
    if ((s === undefined) || (s === null) || (s === '') || (s === NaN)) {
        return zDef;
    } else {
        return s;
    }
}

// (123,4) => "0123"
function lz(num, places) {
    var zero = places - num.toString().length + 1;
    return Array(+(zero > 0 && zero)).join("0") + num;
}


// Date Related Functions
Date.prototype.format = function (format) {
    var o = {
        "M+": this.getMonth() + 1, //month
        "d+": this.getDate(),    //day
        "h+": this.getHours(),   //hour
        "m+": this.getMinutes(), //minute
        "s+": this.getSeconds(), //second
        "q+": Math.floor((this.getMonth() + 3) / 3),  //quarter
        "S": this.getMilliseconds() //millisecond
    };
    if (/(y+)/.test(format)) format = format.replace(RegExp.$1,
        (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)if (new RegExp("(" + k + ")").test(format))
        format = format.replace(RegExp.$1,
            RegExp.$1.length == 1 ? o[k] :
                ("00" + o[k]).substr(("" + o[k]).length));
    return format;
};

// eg. Date.add('d',-1,date)
Date.add = function add(interval, number, date) {
    switch (interval.toLowerCase()) {
        case "y":
            return new Date(date.setFullYear(date.getFullYear() + number));
        case "m":
            return new Date(date.setMonth(date.getMonth() + number));
        case "d":
            return new Date(date.setDate(date.getDate() + number));
        case "w":
            return new Date(date.setDate(date.getDate() + 7 * number));
        case "h":
            return new Date(date.setHours(date.getHours() + number));
        case "n":
            return new Date(date.setMinutes(date.getMinutes() + number));
        case "s":
            return new Date(date.setSeconds(date.getSeconds() + number));
        case "l":
            return new Date(date.setMilliseconds(date.getMilliseconds() + number));
    }
};

// eg. Date.diff('d',date1,date2)
Date.diff = function (interval, date1, date2) {
    var long = date2.getTime() - date1.getTime(); //相差毫秒
    switch (interval.toLowerCase()) {
        case "y":
            return parseInt(date2.getFullYear() - date1.getFullYear());
        case "m":
            return parseInt((date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth()));
        case "d":
            return parseInt(long / 1000 / 60 / 60 / 24);
        case "w":
            return parseInt(long / 1000 / 60 / 60 / 24 / 7);
        case "h":
            return parseInt(long / 1000 / 60 / 60);
        case "n":
            return parseInt(long / 1000 / 60);
        case "s":
            return parseInt(long / 1000);
        case "l":
            return parseInt(long);
    }
};


// for debug only, e.g. debugOut(data);
function debugOut(xObj4Watch, xIsPopup) {
    if (xIsPopup) alert(angular.toJson(xObj4Watch));
    console.log(angular.toJson(xObj4Watch));
}


// ************* Common Functions for WebService Call *************

// show ErrorFound Dialog on page
function showErrorFoundDialog(data) {
    endWait();
    showRunTimeError();
    gotoLogin();
}

// call web service with error handling
// next(replyObj,val) // val= replyObj.dat[0].result
function callWebService(xHTTP, xURL, xPara, xIsAtLeast1RecordRequired, next) {
    startWait(xURL);
    xHTTP.post(xURL, xPara)
        .success(function (data) {
            //alert(angular.toJson(data));
            if (checkSVCReturnOK(data)) {
                if (xIsAtLeast1RecordRequired) {
                    //onsole.log(data.data);
                    if (checkSVCReturnWithRecords(data.data)) {
                        var zVal;
                        if (data.data.length > 0) {
                            zVal = nz(data.data[0].result);
                        }
                        next(data, zVal);
                    }
                }
                else {
                    next(data);
                }
                endWait(xURL);
            } else {
                showErrorFoundDialog();
            }
        }).error(
        function (data, status, headers, config) {
            console.log("err in webservice call");
            console.log(data);
            console.log(status);
            console.log(header);
            console.log(config);
        }
        //showErrorFoundDialog
    );
}


// check return value from web service, show dialog if error
function checkSVCReturnOK(data) {
    if (data.isErrorFound) {
        showErrorFoundDialog(data);
        return false;
    }
    else {
        return true;
    }
}

// check if return value is with at least 1 record
function checkSVCReturnWithRecords(data) {
    if (data[0].length == 0) {
        showErrorFoundDialog(data);
        return false;
    }
    else {
        return true;
    }
}

// ************* Common Form Validation Check Functions *************
function clearErrorMsg() {
    clearMsg('.msg-error');
}

var FORM_CHECK_SERVICE = 'form_check_service';
function prepareFormCheck() {
    startFormValidation();
    startWait(FORM_CHECK_SERVICE);
    clearErrorMsg();
}

function endFormCheck(next) {
    endWait(FORM_CHECK_SERVICE);
    if (isFormValidated() && next)  next();
}

function showFVMsg(msgID, controlID) {
    setFormValidationHints('#' + msgID, '#' + controlID, $('#' + msgID).data('validationOrder'))
}

function isEmail(xString) {
    var reg = /^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$/;
    return reg.test(xString);
}


// ************** Object ***********

// 获取两个对象的不同之处 返回差异项组成的对象
function getObjectDiff(template, override) {
    var ret = {};
    for (var name in override) {
        if (name in template) {
            if (!_.isEqual(template[name], override[name])) {
                ret[name] = override[name];
            }
        }else {
            ret[name] = override[name];
        }
    }
    return ret;
}

// 按照給定屬性名數組(xProperties)，获取两个对象的不同之处 返回差异项组成的对象(只在override中存在的属性才会出现)
//getObjectDiffWithGivenProperties({a:1},{xx:"2"},["a","xx"]) => {xx: "2"}
//getObjectDiffWithGivenProperties({a:1,xx:"2"},{a:3,xx:"2"},["a","xx"]) => {a: 3}
function getObjectDiffWithGivenProperties(template, override,xProperties) {
    var ret = {};
    var zTemplate=nz(template,{});
    var zOverride=nz(override,{});
    var zProperties=nz(xProperties,{});
    _.each(zProperties,function(xProperty){
        if (!_.isEqual(zTemplate[xProperty],zOverride[xProperty]) && zOverride.hasOwnProperty(xProperty)) ret[xProperty] = override[xProperty];
    });
    return ret;
}


function copyModifiedProperties2Object(xOriginalObject, xModifiedObject, xNewObject) {
    var zOriginalObject = nz(xOriginalObject, {});
    var zModifiedObject = nz(xModifiedObject, {});
    var zKeys = _.union(_.keys(zOriginalObject), _.keys(zModifiedObject));
    for (var i = 0; i < zKeys.length; i++) {            // 新旧对象属性逐一比较
        var zOriginalValue = zOriginalObject[zKeys[i]];
        var zModifiedValue = zModifiedObject[zKeys[i]];
        var zIsModified = false;
        //onsole.log(zKeys[i]);
        //onsole.log('zOriginalValue', zOriginalValue,_.isArray(zOriginalValue));
        //onsole.log('zModifiedValue', zModifiedValue,_.isArray(zModifiedValue));
        //onsole.log('o&m', zOriginalValue,zModifiedValue,zOriginalValue !== zModifiedValue);
        if (_.isArray(zOriginalValue)) {                // 如果原对象的该属性是数组
            //onsole.log('zOriginalValue', zOriginalValue);
            if (_.isArray(zModifiedValue)) {
                //onsole.log('zModifiedValue', zModifiedValue);
                //onsole.log('difference', _.difference(zModifiedValue, zOriginalValue));
                if ((_.difference(zOriginalValue, zModifiedValue).length > 0) || (_.difference(zModifiedValue, zOriginalValue).length > 0)) {
                    zIsModified = true;
                }
            } else {
                zIsModified = true;
            }
        } else if (zOriginalValue !== zModifiedValue) { // 如果原对象的该属性是上述以外,而且不等
            zIsModified = true;
        }

        if (zIsModified) xNewObject[zKeys[i]] = zModifiedValue;
    }
}


/**
 * 对象数组深拷贝的第二种方法，对对象中的function同样有效
 */
function deepExtend(destination, source) {
    var getType = function (o) {
        return ((_t = typeof(o)) === "object" ? o === null && "null" || Object.prototype.toString.call(o).slice(8, -1) : _t).toLowerCase();
    };
    for (var zKey in source) {
        if (getType(source[zKey]) === "array" || getType(source[zKey]) === "object") {
            destination[zKey] = getType(source[zKey]) === "array" ? [] : {};
            arguments.callee(destination[zKey], source[zKey]);
        } else {
            destination[zKey] = source[zKey];
        }
    }
}

// ************** String ***********

// statrsWith a sub string ?
String.prototype.startsWith = function (str) {
    return this.indexOf(str) == 0;
};

String.prototype.endsWith = function (suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

// trim a sting from whitespace
String.prototype.trim = function () {
    var str = this;
    var whitespace = ' \n\r\t\f\x0b\xa0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000';
    for (var i = 0; i < str.length; i++) {
        if (whitespace.indexOf(str.charAt(i)) === -1) {
            str = str.substring(i);
            break;
        }
    }
    for (i = str.length - 1; i >= 0; i--) {
        if (whitespace.indexOf(str.charAt(i)) === -1) {
            str = str.substring(0, i + 1);
            break;
        }
    }
    return whitespace.indexOf(str.charAt(0)) === -1 ? str : '';
};


// strip HTML Tags in a string
String.prototype.stripHTMLTag = function () {
    var reTag = /<[^>]+>/g;
    return this.replace(reTag, "");
};

// 返回的随机字符串, 参数len为返回的随机字符串长度。如果不带参数默认输出32个字符。
function randomString(len) {
    len = len || 32;
    var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678!?';
    /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
    var maxPos = $chars.length;
    var pwd = '';
    for (i = 0; i < len; i++) {
        pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd;
}

//ReplaceAll for String. e.g. "xxx".replaceAll("x","a");
String.prototype.replaceAll = function (s1, s2) {
    return this.replace(new RegExp(s1, "gm"), s2);
};


// ************** Array ***********
function clearArray(xArray) {
    if (_.isArray(xArray)) {
        var zL = xArray.length;
        for (var zI = 0; zI < zL; zI++) {
            xArray.pop();
        }
    }

}

function assignArray(xArray, xFromArray) {
    if (_.isArray(xArray) && _.isArray(xFromArray)) {
        clearArray(xArray);

        var zL = xFromArray.length;
        for (var zI = 0; zI < zL; zI++) {
            xArray.push(xFromArray[zI]);
        }
    }

}

// ************** TimeStamp ***********
// xDateTimeString: ISO format:"yyyy-MM-ddThh:mm:ss.SSSZ"
// return: e.g. 2015-0128-0612-56722
function convertISODateTime2Stamp(xDateTimeString) {
    try {
        var zRes = xDateTimeString.replaceAll("-", "").replaceAll(":", "").replaceAll("T", "").replaceAll("Z", "");

//    var zDateTimeArray= zRes.split(".");
//    zPart_DateString = zDateTimeArray[0];
//    zPart_TimeString = zDateTimeArray[1] +zDateTimeArray[2];
//    onsole.log("convertISODateTime2stamp",zRes,zRes.substr(0,4)+"-"+zRes.substr(4,4)+"-"+zRes.substr(8,4)+"-"+
//        zRes.substr(12, 2) + zRes.substr(15, 3)
//    );

        zRes = zRes.substr(0, 4) + "-" + zRes.substr(4, 4) + "-" + zRes.substr(8, 4) + "-" + zRes.substr(12, 2) + zRes.substr(15, 3);

        return zRes;
    } catch (err) {
        return "";
    }

}
//onsole.log(convertISODateTime2stamp("2015-01-28T12:04:56.722Z"));


// f:浮点数 digit：小数位数， 返回精确的数值 （防止浮点误差）
Math.formatFloat = function (f, digit) {
    try {
        var m2 = Math.pow(10, digit * 2);
        var m1 = Math.pow(10, digit);
        //onsole.log(parseInt(f * m2, 10),parseInt(f * m2, 10)/m1,Math.ceil(parseInt(f * m2, 10)/m1))
        return (f > 0) ?
            (Math.ceil(parseInt(f * m2, 10) / m1) / m1) :
            (Math.floor(parseInt(f * m2, 10) / m1) / m1);
    } catch (err) {
        return 0;
    }

};

/*
 xValue 输入的值 不可缺省
 xFixedDigits 保留小数的位数 可缺省
 xDefaultValue 如果输入的值不能转换成数字，那显示此值，即默认值
 return 转换成数字类型的值
 */

Math.parse  =function (xValue,xFixedDigits,xDefaultValue){
    var zValue =parseFloat(xValue);
    if(_.isNaN(zValue)) zValue = nz(xDefaultValue,0);
    if(_.isNumber(xFixedDigits)) zValue = Math.formatFloat(zValue,xFixedDigits);
    return zValue;
}



function setInputFocus(xSelector) {
    setTimeout(
        function () {
            $(xSelector).focus().select();
        },
        600
    );
}

/**
 * 检验文本是否为10进制数字 ("123".true / "ABC".false)
 * @param obj 任意待检验的参数
 */
function checkIsNumeric(obj) {
    return !jQuery.isArray( obj ) && (obj - parseFloat( obj ) + 1) >= 0;
}

/**
 * 检验文本是否为日期
 * @param obj 任意待检验的参数
 */
function checkIsDate(obj) {
    if ((""+obj).length<9) return false;
    var zDate = new Date( obj );
    return _.isDate(zDate) &&  (!_.isNaN( zDate.getYear()));
}

/**
 * 金额小写转换为金额大写
 * @param xAmount Number
 */
function convertAmount2Uppercase(xAmount) {
    var zAmount = nz(xAmount, '');
    //onsole.log(zAmount);
    if (!_.isNumber(zAmount)) return 'Invalid amount';
    if (zAmount > 999999999) return 'Too large amount';


    var fraction = ['角', '分'];
    var digit = [
        '零', '壹', '贰', '叁', '肆',
        '伍', '陆', '柒', '捌', '玖'
    ];
    var unit = [
        ['元', '万', '亿'],
        ['', '拾', '佰', '仟']
    ];
    var head = zAmount < 0 ? '负' : '';
    zAmount = Math.abs(zAmount);
    var s = '';
    for (var i = 0; i < fraction.length; i++) {
        s += (digit[Math.floor(zAmount * 10 * Math.pow(10, i)) % 10] + fraction[i]).replace(/零./, '');
    }
    s = s || '整';
    zAmount = Math.floor(zAmount);
    for (var i = 0; i < unit[0].length && zAmount > 0; i++) {
        var p = '';
        for (var j = 0; j < unit[1].length && zAmount > 0; j++) {
            p = digit[zAmount % 10] + unit[1][j] + p;
            zAmount = Math.floor(zAmount / 10);
        }
        s = p.replace(/(零.)*零$/, '').replace(/^$/, '零') + unit[0][i] + s;
    }
    return head + s.replace(/(零.)*零元/, '元')
            .replace(/(零.)+/g, '零')
            .replace(/^整$/, '零元整');
}

// generate GUID
function getGUID() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }


    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();

}
// require external file (js/css/site icon)
function requireFile(xPath, xFileType) {
    if (xFileType == 'js') {
        $("head").append('<script src="'+xPath+'" type="text/javascript"></script>');
    }

    if (xFileType == 'css') {
        $("head").append('<link href="'+xPath+'" rel="stylesheet">');
    }

    if (xFileType == 'icon') {
        $("head").append('<link rel="Shortcut Icon" href="'+xPath+'">');
    }
}


// get each value of object properties, merge them into a string (excpet "$...",properties)
function getObjectValueString(xObj){
    var zRes="";

    _.each(xObj,function (value,key){
        var zKey=nz(key,"");
        zKey=""+zKey;
        if (!zKey.startsWith('$')) {
            zRes +=JSON.stringify(value)+" ";
        }
    });

    return zRes;
}
// chance.js
var chance=new Chance();

//超出屏幕后附着在指定位置
//xScrollDiv 外围滚动的div
//xDiv 自身div
//xTop 顶部距离
function setDivSticky(xScrollDiv,xDiv,xTop) {
    var zOffsetTop = $(xDiv).offset().top;
    var zWidth = $(xDiv).width();
    $(xScrollDiv).scroll(function () {
        if ($(xScrollDiv).scrollTop() > zOffsetTop) {
            console.log("fixed");
            $(xDiv).css({"position": "fixed", "top":xTop, "width": zWidth});
        } else {
            console.log("static");
            $(xDiv).css({"position": "static", "top": "0","width":"300px"})
        }
    })
}





//刷新子表动画
function refreshAnimation(xSelector){
    console.log("refreshAnimation triggered!");
    $(xSelector).hide();
    setTimeout(function(){
        $(xSelector).show();
    },20)
}



//function MaxMe(o) {
//    o.style.height = o.scrollTop + o.scrollHeight + "px";
//}


function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
}

function b64DecodeUnicode(str) {
    return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}


// Debug Log On/Off
function setConsoleLogOn(){
    console.log=console._log;
};

function setConsoleLogOff(){
    if (!console._log) console._log=console.log;
    console.log=function(){};
};

