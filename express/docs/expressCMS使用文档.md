# expressCMS说明
expressCMS是一个简单的读写文件的http-server,拥有注册，登录，读取个人信息（管理员可以读取多人信息），留言，储存统计log 的功能。

## 安装
安装node.js
解压文件夹expressCMS到任意目录即可

## 启动
进入expressCMS文件夹，按住shift，点击右键，选择在此处打开命令窗口，在弹出的命令框中输入 npm start 启动服务器，
回车，出现

>xxx start xxx

>node ./bin/www

字样表示启动成功

## 目录结构
### webRoot

expressCMS下的是web根目录，webRoot下分为：

#### public 
公共目录：存放html，css，js等公共静态文件，任何人都能访问；
#### userPage
私有目录：存放每个用户的文件夹，除管理员可以访问所有文件夹外，普通用户只能访问自己userID对应的文件夹。用户文件夹下可以存放任意文件及文件夹,程序只会读取txt、jpg、jpeg、png、JSON的文件内容.可以在这里自由存放要显示在前台的内容。

### dataRoot

expressCMS下的dataRoot存放用户写入的文件

新版将用户及生成数据转入DB，此目录暂时不做它用

## 调用 外部js接口

环境变量：_PATH_SETTINGS_EXTERNAL_JS_FILES

指向一个 外部js接口配置文件。



### 外部js接口 配置文件 的格式
存放引入js文件路径的配置json文件

{

​	接口名：{ path:路径 }

​	...

}

例： 

```
{
	"writeLog":{path:"C:/TEST1013/LOG/writeLog.js"}
	"readLog":{path:"C:/TEST1013/LOG/readLog.js"}
}
```

配置文件的路径在环境变量中定义。



## 环境变量

在启动时可以对环境变量进行设置。

想改变文件结构或想改变端口号，只要在命令行启动命令前加上 

set 变量名 = 想填的值即可

环境变量分为：

### 绝对路径
* _PATH_WEB_ROOT  

  web根目录

  默认为：expressCMS文件夹下的 '/webRoot/'

  ​


* \_PATH_USER_PAGE

  userPage用户文件目录： 

  默认为：expressCMS文件夹 下的 ' /webRoot/userPage/'

  ​


* \_PATH_DATA_ROOT 

  dataRoot写入信息的目录

  默认为：expressCMS文件夹 下的 ' /dataRoot/'

  ​

### 相对与web根目录的URL
* \_URL_PUBLIC

  public公共文件夹相对路径：   
  默认为： ' /public/'

  ​

* \_URL_COMMENTS (弃用)
  comments评论文件夹相对路径 
  默认为： ' ../dataRoot/comments/'

  ​

* \_URL_ACCOUNTS (弃用)
  accounts帐号文件夹相对路径: 
   默认为： ' ../dataRoot/accounts/',

  ​

* \_URL_USER_PAGE (弃用)
  userPage私有文件夹相对路径：     
  默认为： ' /userPage/'

## 其他

* \_PATH_SETTINGS_EXTERNAL_JS_FILES
  存放引入js文件路径的配置文件 的 路径 

* DEBUG
  使用 debug 模块， 来输出错误信息。

  例如：set DEBUG="xxx" (开启调试模式)

  默认：关闭


* COOKIE_MAXAGE
  登录过期时间，精确到毫秒，
  默认为60s（60000）

  ​

* SESSION_SECRET
  设置自定义session的密码

  ​

* STATIC
  静态文件夹的绝对路径 ,此文件夹下的内容可通过网页访问 
  默认为：expressCMS文件夹 下的 ' webRoot'

  ​

* PORT：
  服务器监听网络端口   
  默认为：3000

## 前端会接收到的信息

### 错误返回信息

｛"error":[error code]}

[error code] 为下列之一

ECMS

* "userIDIsNull" （用户名为空）



- "pwdIsNull" (密码为空)
- "updatePwdIsNull"（修改密码为空）



- "userIDLengthError"（用户名长度超出范围" 注册3-40)



- "pwdLengthError"（密码长度超出范围 " 注册3-20，登录7-60,
- "updatePwdLengthError"（修改密码长度超出范围 " 注册3-20，登录7-60,



- "userIDInvalid"（用户名不合法（有非法字符））
- "pwdInvalid"（ 密码不合法（有非法字符））



- "updatePwdInvalid"（修改密码不合法（有非法字符）"
- "accessDenied"（请求不合法）
- "commentIsNull"（评论内容为空）
- "interfaceNotFound"(接口未找到)
- "rolesNotFound"（未定义的角色）
- “userIDNotInputted”（未传userID）


MOD


- "savingFailed"（保存信息错误）



- "userIDDuplicated"（用户ID重复）



- "pwdNotMatched"（密码不匹配）



- "userIDNotFound"（userID未找到）



- “activationCodeNotFound”（激活码未找到）
- “activationLimitReached”（激活码激活次数已使用完）






### 成功返回信息
{任意返回结果} 但不包含 "error"属性

无返回结果时，返回 {}



