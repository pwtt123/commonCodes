# expressCMS说明
expressCMS是一个简单的读写文件的http-server,拥有注册，登录，读取个人信息（管理员可以读取多人信息），留言，储存统计log,的功能

## 安装
安装node.js
解压文件夹expressCMS到任意目录即可

## 启动服务器：
进入expressCMS文件夹，按住shift，点击右键，选择在此处打开命令窗口，在弹出的命令框中输入 npm start 启动服务器，
回车，出现

>xxx start xxx

>node ./bin/www

字样表示启动成功



# 设置
## 文件结构
## webRoot

expressCMS下的是web根目录，webRoot下分为：

### public 
公共目录：存放html，css，js等公共静态文件，任何人都能访问；
### userPage
私有目录：存放每个用户的文件夹，除管理员可以访问所有文件夹外，普通用户只能访问自己userID对应的文件夹。用户文件夹下可以存放任意文件及文件夹,程序只会读取txt、jpg、jpeg、png、JSON的文件内容.可以在这里自由存放要显示在前台的内容

## dataRoot

expressCMS下的dataRoot存放用户写入的文件，分为：

### comments
存放所有评论的JSON文件。例: pwt#201707281813222.json；
### accounts
存放所有帐号信息的JSON文件。例 : pwt.json
### logs
存放用户，登陆信息等 log信息的JSON文件，pwt#201707281813222.json

##文件命名及内容
### acconts/JSON文件：
文件名用userID命名 例:pwt.json，存放密码，昵称，角色，和其他信息 

sample：{
"pwd":"222222","userName":"pwt","role":"user"......
}

role分为管理员：admin 和普通用户：user，

### comments/JSON文件：
以userID+"#"+精确到毫秒的时间数字命名，例:amy#20170728104314771.json
存放评论时间，评论内容，以及是否是管理员

sample：{
"admin":true,"time":"2017-07-28 10:43:14","value":"ww"
}

管理员的评论有admin属性，普通用户没有

### logs/JSON文件：
以userID+"#"+精确到毫秒的时间数字命名,例:amy#20170804145623771.json

sample：{
"userID":"amy","time":"2017-08-04 14:56:23","data":"登录信息","tag1":"","tag2":"","tag3":"","verb":"login","IP":"192.168.1.105"
}

# 接口：
### accessUserData:
获取所有_URL_USER_DATA路径的请求,管理员可以访问所有文件，普通用户只能访问自己的文件夹以及_xxx特殊目录

### register.do:
传入userID，pwd，updatePwd,userName,等信息，

注册时，userID,pwd不能为空且不能有特殊字符，验证未通过返回｛error:"..."｝，通过会在dataRoot下创建新的用户JSON文件，返回｛success:"registerSuccess"｝

修改时,userID,pwd,updatePwd,不能为空且不能有特殊字符，密码不正确或验证不通过返回｛error:"..."｝，通过，会修改用户传入的
信息,未传的信息不会修改，返回｛success:"modifySuccess"｝

sample:

in:

	{
	userID："pwt",    		//账号
	pwd:"123321",			//密码
	updatePwd:"654321",		//修改的密码
	userName:"",			//其它信息
	mail:""...
	}


### login.do: 
 传入密码和帐号 ，为空或未注册返回{error:"xxx"}，通过验证返回｛success：{userName:xxx,role:xxx}｝

权限：

- user

  获取此user自身的信息

- op

  获取此op,有权管理的所有用户信息

  其中所有用户的userID列表，会存放在session.user中，作为此op角色的可操作用户权限的判断依据

- admin

  不能获取用户信息



sample:

in:

	{
	userID:"pwt"		//账号
	pwd:"222222"		//密码
	}

return:

	{
	success：{userName:"pwt",role:"admin"}		//返回的对象
	}







### getUserIDs .do：

获取到请求后，验证未通过或出错，返回{error:"xxx"} ，正常 role为admin，返回所有userID,userName对象数组，role为user，他的userID及userName作为数组返回

sample:

return:

	{
	dirName:[{"userID":"amy","userName":"xxx"},
			{"userID":"pwt","userName":"xxx"}
			...
	 		]
	}

### getUserPage .do:
 传入userID, 验证未通过或出错，返回{error:"xxx"} ,  正常 返回userID 文件夹下的数据对象，txt文件返回txt的内容，图片返回web根目录下的图片路径，文件夹递归返回文件夹下的内容对象,多层目录会返回多层嵌套对象

sample:

in:	

	{
	 userID:"amy" , //想要获取内容的userID
	}

in:

	{
	 userID:"login" , //特殊的文件名
	 isPublic:1          // 1.不需要用戶登录，可访问特殊的公开目录, userID前会自动拼接“_”  //0, default 需要用户登录后才能访问 (例子会访问:"_login")
	}

return:

	{
	基本信息.txt:Object
	成绩:Object
	获奖:Object
	表现:Object
	cTime:"2017-07-31T02:41:46.710Z"
	fileName:"表现"
	isDirectory:true
	value:Object
	表现1.jpg:Object
	           {
	                								cTime:"2017-07-31T02:41:46.710Z"       // 文件的变化时间
	                fileName:"表现1.jpg"    //文件名
	                isDirectory:false       //是否是一个文件夹
	                value:"../userPage/amy/表现/表现1.jpg"          //文件的内容
	           }
	表现1.txt:Object
	表现2.jpg:Object
	表现2.txt:Object
	}

### readComments.do:
传入userID,验证未通过或出错，返回{error:"xxx"} ，正常返回对应的评论对象
属性有time:评论的时间，content:评论的内容，isAdmin:是管理员的评论会有这个属性，值为true，普通用户没有这个属性

sample:

in:

	{
	dir:"amy"
	}

return:

	{
	amy#20170731110927572.json:Object
	amy#20170801092232984.json:Object
	cTime:"2017-08-01T01:22:32.986Z"
	fileName:"amy#20170801092232984.json"               //文件名
	cTime:"2017-08-01T03:02:11.210Z"   // 文件的变化时间
	isDirectory:false                                                       //是否是一个文件夹
	value:Object                                                               //文件的内容
	      {
	           IP:"::1"     	  //IPD地址
	           content:"asd"      //评论内容
	           isAdmin:true       //是否是管理员的评论
	           time:"2017-08-01 09:22:32"     //评论时间
	      }
	}

### writeComment.do
传入userID和评论内容，后端获取userRole和时间，写入评论json文件，验证未通过或出错，返回{error:"xxx"}，成功写入返回{success:"xxx"}

ample:

in:

	{
	dir:"pwt"
	comment:"这是评论内容"
	} 

写入JSON文件sample

	{
	"isAdmin":true,
	"time":"2017-08-01 17:42:29",
	"content":"这是评论内容",
	"IP":"102.169.1.102"
	}


### writeLog.do：
传入userID,data,tag1,2,3,veb，后端获取ip和时间，写入log/json文件
接近comment
in:

	{
	userID
	verb:"",
	tag1:"",
	tag2:"",
	tag3:"",
	 data: {}
	}

写入JSON的数据sample:

	{
	 IP：192.158.01.102
	 data：“登录信息”
	 time：“2017-08-01 17:42:29 ”，
	 userID:"pwt",
	 verb:"",
	 tag1:"",
	 tag2:"",
	 tag3:""
	}

### logout.do:
获取请求后，注销session.user,返回{success:logoutSuccess}

### getAUData.do
传startDate，endDate,daily/monthly/weekly,返回统计结果,只能管理员权限统计
in
	{
	startDate:"2017-07-02 09:30:58",      
	endDate:"2017-09-02 09:30:58",
	frequency:"daily",
	countData:{}
	}

返回数据


	{
	2017-9-13:｛
	只访问一次的用户数:(...)
	平均访问次数:(...)
	用户数:(...)
	访问多次的用户数:(...)
	访问总量:(...)
	非1次访问平均访问次数	:(...)
	｝，
	2017-9-13{
	}...
	}


### getActivationCode.do
传用户信息，返回未使用的激活码，

in

	{
	userID:"",
	mail:"",
	
	}

return

	{
	success:"3107b44c-2236-516d-bb78-611d02586f50"
	}


### signMachineCode.do
获取前端的机器码 以及激活码，判断激活码正确后，读取私钥，加密后返回给前端

in

	{
	activationCode:xxxxxxxxxx
	computerMessage:XXX
	}

return 

	{
	success:"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
	xxxxxxxxxxxxxxxxxxxx
	xxxxxxxxxxxx=="
	}



### createPageDetail.do

创建组件明细

参数：

* isTemplate，是否操作模版表，不传此参数操作 对客展示 表
* 其它参数见 ECMS.MOD.bizLyst/design/interface.md，此接口的 xInput参数

### updatePageDetail.do

修改组件明细

参数：

- isTemplate，是否操作模版表，不传此参数操作 对客展示 表
- 其它参数见 ECMS.MOD.bizLyst/design/interface.md，此接口的 xInput参数



### deletePageDetail.do

删除组件明细

- isTemplate，是否操作模版表，不传此参数操作 对客展示 表
- 其它参数见 ECMS.MOD.bizLyst/design/interface.md，此接口的 xInput参数

### getPageDocs.do

获取 对客展示页 ID集合，user角色只能获取自己的对客展示页，op角色可以获取某个分店可使用的模版，以及某个用户的对客展示页，admin角色可以获取所有模版，

- isTemplate: 1/0   存在则操作模版表，不存在操作对客展示表
- ifIncludeInactivePages，是否包含未激活的页面记录，不存在只返回激活的记录，存在则返回所有的记录，ECMS根据请求者的·角色来判断
- 其它参数见 ECMS.MOD.bizLyst/design/interface.md，此接口的 xInput参数



### clonePage.do

复制一个对客展示页 记录及 子记录 ，新增到数据库，

- isFromTemplate , 是否复制模版表的记录，不传此参数复制 对客展示 记录
- ifCloneAsTemplate  ,   是否复制到模版表,不传此参数复制到 对客展示表
- 其它参数见 ECMS.MOD.bizLyst/design/interface.md，此接口的 xInput参数

### createPage.do

创建模板，

- isTemplate，是否操作模版表，不传此参数操作 对客展示 表
- 其它参数见 ECMS.MOD.bizLyst/design/interface.md，此接口的 xInput参数

### readPage.do

读取一个模板,及模版下的所有组件明细

- isTemplate，是否操作模版表，不传此参数操作 对客展示 表
- 其它参数见 ECMS.MOD.bizLyst/design/interface.md，此接口的 xInput参数

### updatePage.do

更新模板

- isTemplate，是否操作模版表，不传此参数操作 对客展示 表
- 其它参数见 ECMS.MOD.bizLyst/design/interface.md，此接口的 xInput参数

### deletePage.do

假删除模板，把模版设为未激活

- isTemplate，是否操作模版表，不传此参数操作 对客展示 表
- 其它参数见 ECMS.MOD.bizLyst/design/interface.md，此接口的 xInput参数




# 模块
### 注册登录模块

register.do ,login.do,loginOut.do

### 读、写评论模块

readComment.do ,writeComment.do

### 写log,统计模块

writeLog.do ,getAUData.do

### 获取用户显示信息模块

getUserIDs.do ,getUserPage.do

### 激活模块

getActivationCode.do ,signMachineCode.do

# 流程：

## 注册

入口： 请求register.do

发送帐号密码等到register.do

- 返回成功

把返回的用户信息保存在localStorage中，执行login.js

- 返回失败

保存失败内容到 localStorage 错误 跳转到 出错页面

1.

## 登录

入口：执行login.js

1.判断localStorage中 帐号密码是否存在

- 存在

发送用户名，密码到login.do,

- 不存在

跳转到login.html,

2.获取login.do返回的信息,

- 返回成功

保存用户名，密码,以及返回的用户昵称，用户角色信息到localStorage,跳转到 用户显示内容界面

- 返回失败

清空 localStorage 密码，保存失败内容到 localStorage 错误
跳转到 出错页面



## 加载登录界面

入口：访问login.html

1.默认显示空白输入项的login.html 

2.点击登录按钮后，把输入的帐号密码保存到localStorage中，执行login.js

## 加载用户界面

入口：访问showFile.html

1,任意请求获取到后端返回的错误｛error:registerAgain｝时,执行login.js

2,自动请求 getUserIDs.do，

- 返回成功

返回数组的第一个值作为userID  自动请求getUserData.do

- 返回失败

错误信息保存在localStorage中，跳转到error.html

3,自动请求getUserData.do 

- 返回成功

页面中展示返回的用户信息

- 返回失败

错误信息保存在localStorage中，跳转到error.html



## 读写评论

入口：访问 getComment.do

发送用户ID到getComment.do

- 返回成功

刷新评论模块

- 返回失败

错误信息保存在localStorage中，跳转到error.html

入口：访问 writeComment.do,

发送评论内容到writeComment.do

- 返回成功

刷新评论模块

- 返回失败

错误信息保存在localStorage中，跳转到error.html

## 记录，统计log

入口：访问 writeLogs.do
发送 ip地址，用户操作等信息，到writeLogs.do

- 返回成功


- 返回失败

打印到控制台

入口：访问 getAUData.do

- 返回成功

展示返回的统计数据

- 返回失败

错误信息保存在localStorage中，跳转到error.html

## 加载出错界面

- 当localStorage 出错信息 不为空时

更具对照表，显示出错信息

-localStorage 出错信息 为空

显示固定字符串 “出错了”



## 登出

入口：访问 logout.do 

- 返回成功

清除localStorage 密码 跳转到登录页面

- 返回失败

错误信息保存在localStorage中，跳转到error.html

## 激活流程

入口 ：访问getActivationCode.do

发送加密后的机器特征码，激活码，以及邮箱地址等到getActivationCode.do

- 返回成功

读取公钥获取机器特征码，加密，同返回的加密数据 进行验证 ，验证成功后把返回的加密数据保存在本地

- 返回失败

错误信息保存在localStorage中，跳转到error.html





#权限

用户分三种权限，user:普通用户，op:客服，admin:后台

### login

通过此接口登录后，会把用户相关信息存放在 session.user中

sample:

```
{
    userID:"pwt",
    userName:"pwt",
    role:"admin",
    pwd:"123456",
    userGroupIDs:["徐家汇分店","九亭分店"]
};
```

### getRelateUserDocs

* user

  获取此user自身的信息

* op

  获取此op,有权管理的所有用户信息

  其中所有用户的userID列表，会存放在session.user中，作为此op角色的可操作用户权限的判断依据

* admin

  不能获取用户信息



### register

* user

  不能注册


* op

  只有op可注册user用户

* admin

  不能注册



### update

- user

  不能修改


- op

  只有op可修改user用户信息

- admin

  不能修改



### readComments

* user

  只能读取自身的评论

* op

  可读取有权的user用户的所有评论

* admin

  不能读取评论



### writeComments

- user

  只能 增加 自身的评论

- op

  可 增加 有权的user用户的 评论

- admin

  不能增加评论



### getAUData

- user

  不能统计

- op

  不能统计

- admin

  可以统计 

  ​

### getPageDocs

- user

  只能获取 自己 的 

- op

  ​

- admin

   

### clonePage

- user

  ​

- op

  ​

- admin

   

### createPage

- user

  ​

- op

  ​

- admin

   

### readPage

- user

  ​

- op

  ​

- admin

   

### updatePage

- user

  ​

- op

  ​

- admin

   

### deletePage

- user

  ​

- op

  ​

- admin

   

### creaePageDetail

- user

  ​

- op

  ​

- admin

   

### updatePageDetail

- user

  ​

- op

  ​

- admin

   

### deletePageDetail

- user

  ​

- op

  ​

- admin

   

# 调用 外部js 操作数据库 规则

## 配置文件设置
新增一个存放引入js文件路径的配置json文件

{接口名：{path:路径}}

例： {writeLog:{path:"C:\\BIZ.FS\\TEST1013\\50.BATCH\\LOG\\writeLog.js"}}

配置文件的路径在环境变量中定义



## 调用的js设置

### 路径：模块名\接口名

例： LOG\wiriteLog.js、LOG\getAUData.js



- ACCOUNT模块

  - register，注册用户信息

  - update，修改用户信息

  - getRelatedUserDocs，获取有权操作的所有用户信息

  - login，登录

    - ​

    ​

- ACTIVATION模块

  - getActivationCode，获取激活码
  - signMachineCode，签名机器特征码

- COMMENT

  - readComments，读取评论
  - writeComment，写入评论

- LOG

  - writeLog，写入日志
  - getAUData，统计日志

- PAGE

  - getPageDocs，新增 对客展示页
  - clonePage，克隆 对客展示页
  - createPage，创建 对客展示页
  - readPage，读取 对客展示页
  - updatePage，修改 对客展示页
  - deletePage，删除对客展示页

- PAGE_DETAILS

  - creaePageDetail，新增 组件明细
  - updatePageDetail，修改 组件明细
  - deletePageDetail，删除 组件明细



### js中方法及参数
所有js中都以 exec 作为方法名

参数 xInput:{insert/update/delete:使用的数据}，xCallBack:回调方法

不同js,xInput内容不同

### 执行js方法的回调方法参数
都是两个参数 err,data 没有则返回空



# 环境变量

## 绝对路径
### \_PATH_WEB_ROOT  
web根目录

默认为：expressCMS文件夹下的 'webRoot\\'

### \_PATH_USER_PAGE
userPage用户文件目录： 

默认为：expressCMS文件夹 下的 ' webRoot\\userPage\\'

### \_PATH_DATA_ROOT 

dataRoot写入信息的目录：    

默认为：expressCMS文件夹 下的 ' dataRoot\\'

## 相对与web根目录的URL
### \_URL_PUBLIC
public公共文件夹相对路径：   

 默认为： ' /public/',
### \_URL_COMMENTS
comments评论文件夹相对路径： 

 默认为： ' ../dataRoot/comments/',

### \_URL_ACCOUNTS 
accounts帐号文件夹相对路径: 
​      
 默认为： ' ../dataRoot/accounts/',

### \_URL_USER_PAGE
userPage私有文件夹相对路径：     

  默认为： ' /userPage/'

## 其他
### DEBUG：
使用 debug 模块 来输出错误信息。
### COOKIE_MAXAGE:
登录过期时间,精确到毫秒，

默认为60s（60000）
### SESSION_SECRET:
设置session的密码
### STATIC：
静态文件夹的绝对路径 ,此文件夹下的内容可通过网页访问 

默认为：expressCMS文件夹 下的 ' webRoot'

### \_PATH_SETTINGS_EXTERNAL_JS_FILES
存放引入js文件路径的配置文件 的 路径 

### PORT：
 网络端口   

默认为：3000


在启动时可以对环境变量进行设置，若想改变文件结构或想改变端口号，
只要在命令前加上 set 变量名 = 想填的值，并用 & 分割开，最后加上npm start 启动即可



#前端会接收到的出错信息

例：｛"error":xxxx｝



* "userIDIsNull":"用户名为空",



- "pwdIsNull":"密码为空 ",



- "userIDLengthError":"用户名长度超出范围" 注册3-40,



- "pwdLengthError":"密码长度超出范围 " 注册3-20，登录7-60,



- "userIDUnLegal":"用户名不合法（有非法字符）",



- "updatePwdUnLegal":"修改密码不合法（有非法字符）"



- "pwdUnLegal":" 密码不合法（有非法字符）",



- "saveRegisterError":"保存注册信息错误",



- "createDirError":"创建用户文件夹错误",



- "loadJSONError":"读取JSON文件错误",



- "userIDExist":"该用户名已存在",



- "updatePwdIsNull":"修改密码为空",



- "saveModifyError":"保存修改信息出错",



- "pwdError":"密码不正确",



- "registerAgain":"登录超时，重新登录",



- "userIDNotExist":"用户未定义userID",



- "userFileNotExist":"用户文件夹不存在",



- "roleNotFound":"未定义的角色",



- "returnDataError":"返回数据出错",



- "fileNameNotGet":"文件名未传入 ",



- "commentIsNull":"评论内容为空",



- "roleNotExist":"用户未定义role ",



- "saveCommentError":"保存评论出错"





# 核心函数：
## loadUserDirData(xDirPath,xRecordID,xCallback,xFilterCallback)
传入userData之后的路径，返回此目录下的txt内容,图片url,文件夹对象（对象内容为递归此函数得出）

xDirPath:定义的公共路径 //e.g.:"settings._PATH_USER_PAGE "

xRecordID:xDirPath下的路径  //e.g"pwt" 、"pwt/表現"

xCallback.xResultDataObject 

 todo: {
"xxx.txt":"...","yyy.jpg":"userData/pwt/yyy.jpg","表现":{"表现1.txt":"..."},"成绩":{"成绩1.txt":".."}...
}

xFilterCallback，读取文件夹下文件时进行筛选，只处理筛选后的文件

## saveJSONData(xOutputObject,xOptions,xCallback)
  save a file under PATH with given output Object  在指定路径下保存json文件

 e.g. \DATA_ROOT\comments\pwt#201707271059119.json

 xOptions:{

  collectionID:"xxx"            // e.g. "comments"

  recordID:"xxx"                  // e.g. "pwt"

  isUpdateDateRecorded:1/0    // e.g. 1. recorded / 0. default not recorded

 }

 xOutputObject：写入JSON文件的内容对象
 xCallback：出错会返回err


## loadJSONData(xOptions,xCallback)
 获取_PATH_DATA_ROOT/collectionID下的fileName 的json文件，返回内容对象

xOptions:{

  collectionID:"xxx"            // e.g. "comments"

  fileName:"xxx"                // e.g. "pwt"

 }

 xCallback：出错会返回err




# 引入文件及设置：

## node-rsa

### npm

npm install node-rsa


## express-session中间件
### npm:
npm install express-session 


### require:
var session = require('express-session')
### sample:
app.use(session(
{'secret': process.env.SESSION_SECRET || '654321',
"resave":true,"saveUninitialized":false,
"cookie":{ maxAge: parseInt(process.env.COOKIE_MAXAGE)|| 60000 }}
));  
## underscore中间件  
### npm:
npm instail underscore 
### require
var _=require('underscore');   
## moment中间件                                 
### npm:
npm instail moment ,  
### require:
var moment = require('moment');                              

app.use(session(
{'secret': process.env.SESSION_SECRET || '654321',
"resave":true,"saveUninitialized":false,
"cookie":{ maxAge: parseInt(process.env.COOKIE_MAXAGE)|| 60000 }}
));  
