var iconv = require('iconv-lite');

/*
判断 buffer 的编码，并解码成 字符串 输出
xBuffer, 带bom（或不带）的buffer数据
return ,不带bom的 解码后的字符串
*/
var decodeBuffer=function (xBuffer) {

  var zDataStr = "";
  var zDecodeType="";

  //判断编码格式，并转码
  if (xBuffer[0] == 0xff && xBuffer[1] == 0xfe) {
    zDecodeType="utf16"
  } else if (xBuffer[0] == 0xfe && xBuffer[1] == 0xff) {
    zDecodeType="utf16"
  } else if (xBuffer[0] == 0xef && xBuffer[1] == 0xbb) {
    zDecodeType="utf8"
  }
  //若不是以上情况，默认视为没有bom
  else {
    //无BOM信息，可能有gbk和utf8两种可能，取前N个字符，分别转换为 gbk 和 utf8,通过判断字的字节长度区分编码格式
    var zTestBuffer=xBuffer.slice(0,1000);
    var zGBKString=iconv.decode(zTestBuffer, 'gbk');
    var zUTF8String=iconv.decode(zTestBuffer, 'utf8');

    // console.log("zUTF8String",zUTF8String.length,"zGBKString",zGBKString.length)

    //判断字的字节长度区分编码格式
    if(zUTF8String.length<=zGBKString.length){
      zDecodeType="utf8";
    }
    //否则 用 gbk编码
    else{
      zDecodeType="gbk";
    }
  }

  //把buffer文件内容 根据编码 转码
  zDataStr = iconv.decode(xBuffer, zDecodeType);

  return zDataStr
};

module.exports = decodeBuffer;
