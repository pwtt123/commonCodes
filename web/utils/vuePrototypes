import Vue from "vue"
import _ from "underscore"
import utils from "@/utils"

// html 转义
Vue.prototype.text2HTML=(v)=>{
  return String(v || "")
  //html转义
    .replace(/[\<\>\&\"]/g,(v)=>{
      return {"\<":"&lt;","\>":"&gt;","\&":"&amp;",'\"':"&quot",}[v] || ""
    })
    //替换空行
    .replace(/\n/g,"<br>")
    // 替换空格
    .replace(/\s/g,"&nbsp;")
};


//xObj:{aa:{bb:{cc...}}}
//xKeyStr:"aa.bb.cc..."
// return xObj.aa.bb.cc...
Vue.prototype.getObjValue=(xObj,xKeyStr)=>{
  let zKeys=(xKeyStr || "").split(".");
  let zValue=zGetValueFunc(xObj,zKeys);
  return zValue
};


function zGetValueFunc(xCurrentObj,xKeyList){
  let zCurrentKey=xKeyList[0];
  let zNewKeyList=_.clone(xKeyList);
  zNewKeyList.shift();
  if(!xCurrentObj[zCurrentKey] || !zNewKeyList.length)return  xCurrentObj[zCurrentKey];
  return zGetValueFunc(xCurrentObj[zCurrentKey],zNewKeyList)
}
