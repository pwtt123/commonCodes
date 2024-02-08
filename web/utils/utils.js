import _ from "underscore"

export default {
  // ************** Array ***********
  clearArray(xArray) {
    if (_.isArray(xArray)) {
      var zL = xArray.length;
      for (var zI = 0; zI < zL; zI++) {
        xArray.pop();
      }
    }
  },
  assignArray(xArray, xFromArray) {
    if (_.isArray(xArray) && _.isArray(xFromArray)) {
      clearArray(xArray);
      var zL = xFromArray.length;
      for (var zI = 0; zI < zL; zI++) {
        xArray.push(xFromArray[zI]);
      }
    }
  },

// **************** Common Functions
// get parameters from URL, xxx.html?key1=value&key2=value2
  urlQueryString(item) {
    var svalue = location.search.match(new RegExp("[\?\&]" + item + "=([^\&]*)(\&?)", "i"));
    return svalue ? svalue[1] : svalue;
  },

  arrayBuffer2Str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
  },

// 字符串转为ArrayBuffer对象，参数为字符串
  str2ArrayBuffer(str) {
    var buf = new ArrayBuffer(str.length * 2); // 每个字符占用2个字节
    var bufView = new Uint16Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  },

  // 对象集合转数组集合
  // filterVal:["a","b","c"]
  // jsonData:[{a:1,c:3,b:2},{c:2,b:3,a:1}]
  // xOptions:{toString:1 转为字符串 }
  //return:[[1,2,3],[1,2,3]]
  objList2ArrayList(filter, data,xOptions) {
    xOptions=xOptions||{};
    // console.log("formatJson",filter,data);
    return data.map(v => filter.map(j => {
      if(xOptions.toString)return String(v[j]);
      return v[j]
    }))
  }


}

// 字符所占长度，中文2字节，英文1字节
String.prototype.gblen = function () {
  var len = 0;
  for (var i = 0; i < this.length; i++) {
    if (this.charCodeAt(i) > 127 || this.charCodeAt(i) == 94) {
      len += 2;
    } else {
      len++;
    }
  }


  return len;
};


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


// Date Related Functions
Date.prototype.format = function (format) {
  var o = {
    "M+": this.getMonth() + 1, //month
    "d+": this.getDate(), //day
    "h+": this.getHours(), //hour
    "m+": this.getMinutes(), //minute
    "s+": this.getSeconds(), //second
    "q+": Math.floor((this.getMonth() + 3) / 3), //quarter
    "S": this.getMilliseconds() //millisecond
  };
  if (/(y+)/.test(format)) format = format.replace(RegExp.$1,
    (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o) if (new RegExp("(" + k + ")").test(format))
    format = format.replace(RegExp.$1,
      RegExp.$1.length == 1 ? o[k] :
        ("00" + o[k]).substr(("" + o[k]).length));
  return format;
};

// eg. new Date().add('d',-1)
Date.prototype.add = function add(interval, number) {
  let date = this;
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
