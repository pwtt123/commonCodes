# commonCodes
some commonCode 2 download

## UI
UI components

## MetaUI
UI components 4 meta

## meta
  // 常用接口属性 展示meta对照表
    /*
          prop: "consumpType", 接口属性名
          label: "收支类型", 显示名称
          minWidth: "100", 最小宽度
          sort: 'custom',  true 前端排序/ false 不可排序/ 'custom' 后端排序
          type:"tag", 显示类型  num/money/data/tag/img/imgList/pwd/month
          dics():翻译字典, return [{id:"0",name:"无效"}...]  , type 为 "tag" 时必须有
          placeholder:"请输入账号",表单填充字符
          rules: 表单验证规则数组，请见 http://element-cn.eleme.io/#/zh-CN/component/form   e.g [ { required: true, message: '请输入活动名称', trigger: 'blur' },{ min: 3, max: 5, message: '长度在 3 到 5 个字符', trigger: 'blur' }]
          ifShow,是否显示
          noRequired:作为表单提交时是否是不必要的，默认都是必要的
          believableValues: [] , 在此数组中的value 直接通过验证
          descProp: 使用此描述prop的值,来作为其他字段的描述
    */
    
    
## apiFunc
e.g.
//获取 是否要显示验证码
  //xReq:null
  getIfShowVerifyCode(xReq,xEvents){
    return http.post("/bToLogin",xReq,xEvents,{noToken:1})
  },

/*
ApiFunc(xReq,xEvents)
  xReq,:接口参数对象
  xEvents:{
    success(data), 成功回调
    err(err), 失败回调
  }
  xOptions:{
    noToken，此接口不需传token,若传了后端会报错
    noErrHandle,此接口需要token,但出现权限错误不需进行登出级提示处理
  }

  return Promise 对象
    .then(data)
    xData:axios res.data


   if(xEvents.err 存在 ) 使用 此回调方法处理错误
   else 走统一错误处理逻辑

*/
