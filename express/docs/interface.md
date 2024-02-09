[TOC]


# ECMS.MOD.bizLyst 接口定义 

##  概述

该文档定义当使用ECMS调用ECMS.MOD.bizLyst操作数据库时，引入的模块及js名 以及 各个js的exec方法传入和传出的参数，以及不同的js实现的具体功能

定义 各个模块操作bizLyst兼容数据库的 js，可供外部（ECMS）调用。

例:

* 用户信息模块：/api/ACCOUNT/

* 其中注册用户信息引入的js：/api/ACCOUNT/register.js

* xInput参数：
  * .userID , 用户ID
    * .userName （可选）,
    * ...

* err返回 
  * "connectingFailed",连接数据库失败

* data返回
  * 无  	

* 实现功能：

    连接 公共参数中dbURL定义数据库，查找dbCollection定义的collection中的数据(简称 记录)，插入用户记录（略）……

    ​


## 接口定义



### 配置参数

- 配置文件：/api/settings.js

- 包含配置项：

  - dbURL：连接数据库url

    例：dbURL:"mongodb://localhost:27017/testDB"

  - dbCollection：collection 名

    例：dbCollection:"activationTest"

### api公共标准

* api 存放路径规范

  模块名/请求名

  例： api/LOG/wiriteLog.js 

  ​

* js中的接口暴露规范

  必须暴露exec函数 (module.exports.exec)

  * exec参数规范 ： function(xInput,xCallBack)
    * xInput：传入的数据
      * ownerID (可选)，如果填写 则会将生成到DB的数据 _ownerID字段设为指定值，默认空。
    * xCallBack：回调函数 function (err, data)
      * err， 错误信息，默认无错为空
      * data，运行结果返回数据

* js中xInput参数处理

  * 若创建记录，默认创建
    * \_bookID:"xx",此数据所属的book 
    * "_guid": chance.guid()
    * "_whenCreated"：new Date()
  * 若参数中有reqUserID,一律不作为CRUD的查询条件
  * reqUserID从session中获取，前端不需要传此参数
  * xInput.userID的userGroupIDs，表示，通过查询 xInput.userID，获取到的记录的userGroupIDs


### 分模块详细说明





#### 登录用户账户信息模块 

/api/ACCOUNT/

登录用户指ECMS应用的用户， 非bizLyst后台界面的登录用户。

##### /api/ACCOUNT/register.js

注册用户信息

* xInput 参数 （对象）
  * .userID，用户ID
  * .userName ，用户显示名称，默认为空，空的含义是同userID
  * .pwd，用户登录口令
  * userGroupID，用户所在分组
  * .userInfo（任意对象），任何可扩展的需要在注册时保留下的用户信息，例如电话，微信……
* err 返回
  * "connectingFailed"，连接数据库失败 
  * "userIDDuplicated"，用户ID已存在
  * "savingFailed"，保存用户信息错误

* data 返回
  * 无


* 实现功能：

    连接dbURL.dbCollection，筛选条件是【_bookID】为【User】，【userID】为xInput.userID。

    * 若记录已经存在，err返回"userIDDuplicated"

    * 若记录不存在，添加新记录

        * "_bookID":"User"
        * "_guid": chance.guid()
        * "role":"user"  // 只能注册 “普通用户”
        * "_ownerID": xInput.ownerID
        * "_whenCreated":new Date()

        xInput.pwd 用 明文，插入到dbCollection


* sample:

xInput:


	{
	userID："pwt",    		//账号
	pwd:"123321",			//密码
	userInfo:{				//其它信息
	userName:"pwt",			
	mail:"109294456@qq.com"，
	tel:"15380374846"}				
	}，



##### /api/ACCOUNT/updateUser.js

修改用户信息

* xInput 参数 （对象）
  * .userID ，用户ID
  * .userName， 昵称
  * .updatePwd， 修改的密码
  * userGroupID，用户所在分组
  * .userInfo（任意对象），任何可扩展的需要修改的用户信息，例如电话，微信……
* err 返回
  * "connectingFailed"，连接数据库失败 
  * "savingFailed"，保存信息错误
  * "userIDNotFound"，用户ID不存在
  * "pwdNotMatched"，密码错误

* data 返回
  * 无

* 实现功能：

    连接dbURL.dbCollection，筛选条件是【_bookID】为【User】，【userID】为xInput.userID,
    * 若记录不存在，err返回"userIDNotFound"
    * 若记录存在

      * 记录.pwd 与 xInput.pwd 不一致，err返回"pwdNotMatched"
      * 记录.pwd 与 xInput.pwd 一致，更新此数据相应数据为xInput.updateInfo中的值
* sample:

xInput:

	{
	userID："pwt",    		//账号
	pwd:"123321",			//密码
			
	updateInfo:{			//需要修改的信息
	pwd:"654321",			
	userName:"pwt",			
	mail:"109294456@qq.com"，
	tel:"15380374846"}				
	}
	}


##### /api/ACCOUNT/getRelatedUserIDs.js

获取当前用户相关连用户的ID信息 （例如，管理员管辖的会员ID集合）

* xInput 参数 （对象）
  * .userID ，用户ID

* err 返回
  * "connectingFailed"，连接数据库失败 
  * "userIDNotFound"，用户ID不存在

* data 返回
  * 包含userID，userName的对象数组

* 实现功能：

    连接dbURL.dbCollection，筛选条件是【_bookID】为【User】，【userID】为xInput.userID,
    * 若记录不存在，err返回"userIDNotFound"
    * 若记录存在
      * 记录.role 为 "user", data 返回 当前记录.userID，记录.userName 对象的数组 （只包含一条记录对象的数组）
      * 记录.role 为 "admin", 查找dbCollection，筛选条件是【_bookID】为【User】 ,【role】为"user",【branchIDs】 被包含在 记录.branchIDs中 ,若管理员的branchIDs为空，则可以管理branchIDs为空的用户
        data 返回查询到的所有userID,以及userName的对象数组（包含多个记录的数组）

* sample:

xInput:

	{userID:xxx}

data:

	xCallBack("",{
	dirName:[{"userID":"amy","userName":"amy1234"},
			{"userID":"pwt","userName":"pwtttt"}
			...
	 		]
	})	





##### /api/ACCOUNT/login.js

用户登录

* xInput 参数 （对象）
  * .userID ， 用户ID
  * .pwd， 用户登录口令
* err 返回
  * "connectingFailed"，连接数据库失败 
  * "userIDNotFound"，用户ID不存在
  * "pwdNotMatched"，密码错误

* **data 返回**
  * 登录用户信息，用来存放在session中

* 实现功能
  连接dbURL.dbCollection中，筛选条件是【_bookID】为【User】，【userID】为xInput.userID,
  * 若记录不存在，err返回"userIDNotFound"
  * 若记录存在

    * 记录.pwd 与 xInput.pwd 不一致，err 返回 为 "pwdNotMatched"
    * 记录.pwd 与 xInput.pwd 一致，data返回 记录
* sample

 xInput:

	{
	userID:"pwt"		//账号
	pwd:"222222"		//密码
	}

data:

	{userID:"pwd",userName:"pwttt",role:"user"}
​	

#### 评论模块

/api/COMMENT/

##### api/COMMENT/readComments.js:

读取评论信息

* xInput 参数 （对象）
  * .userID ， 用户ID
  * .pageNum，当前页数
  * .pageRecsNum，每页条数
* err 返回
  * "connectingFailed"，连接数据库失败
  * "userIDNotFound"，用户ID不存在
* data返回
  * 评论数据对象

* 实现功能
  连接dbURL.dbCollection，筛选条件是【_bookID】为【Comment】，【userID】为xInput.userID,跳过(xInput.pageNum-1)*xInput.pageRecsNum条数据，查找xInput.pageRecsNum条数据
  * 若记录不存在，err返回"userIDNotFound"
  * 若记录存在,data 返回查到的所有记录

* sample:

xInput:

	{
	userID:"amy"
	}


data:

	xCallBack("",{
	userID:"amy"
	cTime:"2017-08-01T03:02:11.210Z"   // 文件的变化时间
	isDirectory:false                                       //是否是一个文件夹
	value:                                                  //文件的内容
	      {
	           IP:"::1"     	  //IPD地址
	           content:"asd"      //评论内容
	           isAdmin:true       //是否是管理员的评论
	           time:"2017-08-01 09:22:32"     //评论时间
	      }
	})

##### api/COMMENT/writeComment.js

储存评论信息

* xInput 参数 （对象）
  * .userID， 用户ID
  * .isAdmin， 是否管理员，默认0
  * .time，评论时间
  * .content， 评论内容
  * .IP，IP地址
* err 返回
  *  "connectingFailed"，,连接数据库失败 
  *  "savingFailed"，保存评论信息错误
* data 返回
  * 无
* 实现功能： 
   连接dbURL.dbCollection，增加记录

   * "_bookID":"评论"
   * "_guid": chance.guid()
   * "_ownerID": xInput.ownerID
   * "_whenCreated"：new Date()
     插入到dbCollection 


* sample:

xInput:


    {
    "userID":"pwt"
    "isAdmin":true,
    "time":"2017-08-01 17:42:29",
    "content":"这是评论内容",
    "IP":"102.169.1.102"
    }

 


#### 储存、统计log模块 
/api/LOG/

##### api/LOG/writelog.js

储存日志信息

* xInput 参数 （对象）
  * IP，IP地址
  * data，Log内容
  * time，写Log时间
  * userID，用户ID
  * verb，Log分类
  * tag1，标签
  * tag2，标签
  * tag3，标签
* err 返回
  *  "connectingFailed"，连接数据库失败 
  *  "savingFailed"，保存评论信息错误
* data 返回
  * 无   	 
* 实现功能：
  连接dbURL.dbCollection，增加新记录
  * "_bookID":"Log"
  * "_guid": chance.guid()
  * "_ownerID": xInput.ownerID
  * "_whenCreated"：new Date()
    插入到dbCollection,

* sample:

xInput:

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

##### api/LOG/getAUData.js

统计活跃用户数据

* xInput 参数 （对象） 
  * startDate，统计数据最早的时间
  * endDate，统计数据最晚的时间
  * frequency，统计频率，"daily"/"weekly"/"monthly"..
* err 返回
  *  "connectingFailed"，连接数据库失败 
* data返回
  * 按时间周期分类统计的，一段时间内的统计数据
* 实现功能： 
  连接dbURL.dbCollection，筛选条件是【_bookID】为【Log】以及【startTime】>=xInput.startDate,<=xInput.endDate,xInput.frequency 进行group分类统计
  data返回统计的数据

* sample:

xInput:

	{
	startDate:"2017-07-02 09:30:58",      
	endDate:"2017-09-02 09:30:58",
	frequency:"daily",
	}

data:​

	xCallBack("",{
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
	})







#### 分组及分店模块

/api/USER_GROUP/

##### /api/USER_GROUP/getUserGroups.js

读取分店及分组信息

- xInput 参数 （对象）

  - userID，登录用户的ID

- err 返回

  - ​

- data 返回

  - [{

    - type，"userGroup"/"branch"，是分店还是分组
    - name，分店，分组名
    - groupInfo，可扩展的分组的信息，{address:“地址”，tel:"电话"}


    - memo，备注


    - _guid，分组的ID},...

    ]


- 实现功能：

  连接dbURL.dbCollection，查询用户信息，筛选条件是【_bookID】为【User】，【userID】为xInput.userID,

  查询分店分组的信息，筛选条件是【_bookID】为【UserGroup】。

  * 若记录.roles 包含 admin ,则返回所有记录
  * 若记录.roles 包含 op，则返回记录.userGroupIDs 以及记录.branchIDs包含的_guid 的记录 


- sample:



in:

```
{
  user:{
  	name:xx,
  	pwd:xx,
  	userInfo:xxx,
  	branchIDs:[xx,xx],
  	userGroupIDs:[xx,xx],
  	roles:["op"]
  	}
}
```



return:

```
[{
- type:"branch"
- name:"分店1"
- groupInfo:{address:“地址”，tel:"电话"}
- memo:"备注"	
},...]，
```



##### /api/USER_GROUP/createUserGroup.js

创建分店，分组

- xInput 参数 （对象）

  - type，"userGroup"/"branch"，是分店还是分组
  - name，分店，分组名
  - groupInfo，可扩展的分组的信息，{address:“地址”，tel:"电话"}


  - memo，备注

- err 返回

  - ​

- data 返回

  - 无


- 实现功能：

  连接dbURL.dbCollection，新增分组记录，添加新记录

  - "_bookID":"UserGroup"
  - "_guid": chance.guid()
  - "_ownerID": xInput.ownerID
  - "_whenCreated":new Date()


- sample:

xInput:

```
{
- type:"branch"
- name:"分店1"
- groupInfo:{address:“地址”，tel:"电话"}
- memo:"备注"	
}
```



##### /api/USER_GROUP/updateUserGroup.js

修改用户信息

- xInput 参数 （对象）

  - type，"userGroup"/"branch"，是分店还是分组
  - name，分店，分组名
  - groupInfo，可扩展的分组的信息，{address:“地址”，tel:"电话"}


  - memo，备注


  - groupID，分组的ID

- err 返回

  * ​

- data 返回

  - 无

- 实现功能：

  连接dbURL.dbCollection，筛选条件是【_bookID】为【UserGroup】，【\_guid】为xInput.groupID,

  - 更新此数据相应数据为xInput中参数

- sample:

xInput:

```
{
- groupID:"xxx-yyy-zzz"
- type:"branch"
- name:"分店1"
- groupInfo:{address:“地址”，tel:"电话"}
- memo:"备注"	
}
```



#### 对客展示内容明细模块

/api/PAGE_DETAILS/
##### api/PAGE_DETAILS/createPageDetail.js
在某个模版中增加新的组件明细
* xInput 参数
  * userID，用户帐号
  * pageID，模板的_guid,
  * referenceDetailID，引用的组件明细guid，有此属性的组件明细，不可更改自身属性，显示为引用的组件明细
  * isForReferenceOnly，此组件明细是否可被引用，默认 false。若有此参数，则此组件显示标志为不可编辑，普通op添加后页无法更改，数据库中存放此组件的guid
  * navItemID，导航标签项目ID，当前组件属于哪个导航标签下显示
  * indent，缩进大小
  * compoHTMLTag，前端组件HTML标签名，例如："leia-text"
  * orderID，排序ID
  * isExpanded，1/0 是否展开
  * compoProps（对象），组件私有的属性  例如，{text:"这是一段文本"}
  * optionGroupName，候选分类名称，为空则不为候选项。不为空时，候选分类名称可用来分组所有候选项，用户添加新明细时，可根据分组方便选出各种已存在的明细记录
  * _ownerID，创建人的userID


* xOptions 参数，存放所有开关信息
  - isTemplate: 1/0   存在则操作模版表，不存在操作对客展示表
* err 返回
  * connectingFailed
  * savingFailed
* data 返回
  * 无
* 实现功能：
   连接dbURL.dbCollection，增加一条记录

   * isTemplage 存在，增加以下属性
     * \_bookID:"UserPageDetailes",
     * FK_UserPage_guid:xInput.pageID

     ​
   * isTemplage 不存在，增加以下属性
     * \_bookID:"UserPageTemplateDetailes"

     * FK_UserPageTemplate_guid:xInput.pageID

       ​

       ​

- sample:

xInput:

```
{
reqUserID："pwt", 
userID："xiao"
pageID:"xxx",			
navItemID:1  
indent:0,			
compoHTMLTag:"text"	
pageDetailID:2
orderID:2
isExpanded:1
_ownerID:"cc"
}，
```



##### api/PAGE_DETAILS/updatePageDetail.js
在某个模版中修改某个组件明细的属性
* input为对象数组，每个对象参数
  * userID，用户帐号
  * pageID，对客展示页的guid
  * pageDetailID，组件明细的guid
  * referenceDetailID，引用的组件明细guid，有此属性的组件明细，不可更改自身属性，显示为引用的组件明细
  * isForReferenceOnly，此组件明细是否可被引用，默认 false。若有此参数，则此组件显示标志为不可编辑，普通op添加后页无法更改，数据库中存放此组件的guid
  * navItemID，导航标签项目ID，当前组件属于哪个导航标签下显示
  * indent，缩进大小 
  * compoHTMLTag，前端组件HTML标签名，例如："leia-text"
  * orderID，排序ID
  * isExpanded，1/0 是否展开
  * compoProps（对象），组件私有的全部属性  例如，{text:"这是一段文本"}
  * optionGroupName，候选分类名称，为空则不为候选项。不为空时，候选分类名称可用来分组所有候选项，用户添加新明细时，可根据分组方便选出各种已存在的明细记录

* xOptions 参数，存放所有开关信息

  - isTemplate: 1/0   存在则操作模版表，不存在操作对客展示表

* err 返回

  * connectingFailed
  * savingFailed

    ​

* data 返回

  * 无

* 实现功能：

  连接dbURL.dbCollection，修改查询到的数据

  * isTemplage 存在，查询条件：

    - \_bookID:"UserPageDetailes"，
    - FK_UserPage_guid:xInput.pageID
    - pageDetailID:xInput.pageDetailID

  * isTemplage 不存在，查询条件

    - \_bookID:"UserPageTemplateDetailes"
    - FK_UserPageTemplate_guid:xInput.pageID
    - pageDetailID:xInput.pageDetailID

    ​

    ​

  - \_bookID:"UserPageTemplateDetailes"
  - FK_UserPageTemplate_guid:xInput.pageID
  - pageDetailID:xInput.pageDetailID

  ​

* sample:

  xInput:

  ```
  {
  reqUserID："pwt",  
  userID："xiao"
  pageID:"xxx",			
  navItemID:1  
  indent:0,			
  compoHTMLTag:"text"	
  pageDetailID:2
  orderID:2
  isExpanded:1
  _ownerID:"cc"		
  }，
  ```

  ​


##### api/PAGE_DETAILS/deletePageDetail.js

删除某个模版的某个组件明细

* input 参数
  * userID，用户帐号
  * pageID，模板的_guid
  * pageDetailID，组件明细的guid

* xOptions  参数，存放所有开关信息

  - isTemplate: 1/0  ， 存在则操作模版表，不存在操作对客展示表

* err 返回

  * connectingFailed
  * savingFailed

* data 返回

  * 无

* 实现功能

  连接dbURL.dbCollection，删除查询到的数据

  - isTemplage 存在 ，查询条件

    - \_bookID:"UserPageDetailes"
    - FK_UserPage_guid:xInput.pageID
    - pageDetailID:xInput.pageDetailID

  - isTemplage 不存在，查询条件
    - \_bookID:"UserPageTemplateDetailes"
    - FK_UserPageTemplate_guid:xInput.pageID
    - pageDetailID:xInput.pageDetailID

    ​

    ​

* sample:

  xInput:

  ```
  {
  reqUserID："pwt",    		
  pageID:"xxx-yyy-zzz",
  userID:"xiao"
  pageDetailID:2	
  }，
  ```

  ​

#### 对客展示内容页面模块

/api/PAGE/

该模块不仅处理 具体的对客展示内容页，也同样接口处理页面模板

##### api/PAGE/getPageDocs.js

获取 对客展示页 ID集合，user角色只能获取自己的对客展示页，op角色可以获取某个分店可使用的模版，以及某个用户的对客展示页，admin角色可以获取所有模版，
* input 参数

  * userGroupID，op角色选择的  user角色 所在的分组ID，获取所有此分组可使用的模版
  * userID，user用户帐号，获取此userID的对客展示页

* xOptions 参数，存放所有开关信息

  - isTemplate（1/0），   存在则操作模版表，不存在操作对客展示表
  - ifIncludeInactivePages，是否包含未激活的页面记录，不存在只返回激活的记录，存在则返回所有的记录，ECMS根据请求者的·角色来判断

* data 返回 

  * [{

    * pageID:"", 模版的_guid

    * pageName:"", 模版名称

    * pageType:""模版的分类 

      },

      ...]

* err返回

  * connectingFailed
  * pageIDNotFound

    ​

* 实现功能

  连接dbURL.dbCollection，返回 查询到的数据的 ID，name，orderID

  * xOption.ifIncludeInactivePages不存在，增加查询条件
    * isActive:1

  - isTemplate存在，查询条件

    - \_bookID:"UserPageTemplate"

  - isTemplate不存在，查询条件

    - \_bookID:"UserPage"
    - userGroupIDs: $in xInput.userGroupID

    ​

* sample:

  xInput:

  ​

  ```
  {
  reqUserID:"pwt"
  groupIDs:[2]
  }，
  ```

  ​

  data:

  ```
  {
  - themeIDs:["red","blue"]	 
  - templates:[{
    - pageID:"1"
    - pageName:"模版1"
    - pageType:"content"
      }]

  }，
  ```

  ​



##### api/PAGE/clonePage.js
复制一个对客展示页 记录及 子记录 ，新增到数据库，

* input 参数
  * userID，"user"角色的帐号，操作模版时可以不传
  * pageID，复制模版的guid

* xOptions  参数，存放所有开关信息

  - isFromTemplate ， 是否复制模版表的记录
  - ifCloneAsTemplate  ，  是否复制到模版表

* err 返回

  * connectingFailed
  * saveingFalied

    ​

* data 返回

  * 无

* 实现功能

  连接dbURL.dbCollection，查询 模版主记录 及 组件明细子记录 ，再次增加到数据库,

  - isFromTemplate不存在，

    - 把userID 对应的对客展示记录设为未激活，筛选条件
      - userID:xInput.userID,
      - \_bookID:"UserPage"

    - 查询主表记录条件

      - "\_bookID"："userPageTemplate",
      - "\_guid":xInput.pageID，

    - 查询子表记录条件

      - "\_bookID"："userPageTemplateDetail",
      - "FK_userPageTemplate_guid":xInput.pageID，

    - 修改主表数据"_bookID":"UserPage"，"\_guid":chance.guid()，"isActive":1

      增加主表记录"userID":xInput.userID

      修改子表数据"_bookID":"UserPageDetails"，"\_guid":chance.guid()

      删除子表数据“FK_userPageTemplate_guid”，

      增加子表数据"FK_userPage_guid":修改后主表数据._guid

    - 插入数据库

  - isFromTemplate 存在，查询模版主表及子表数据,条件同上，

    - 修改主表数据"_bookID":"UserPageTemplate"，"\_guid":chance.guid()，"isActive":1

      修改子表数据"_bookID":"UserPageTemplateDetails"，"\_guid":chance.guid()

      “FK_userPageTemplate_guid”:修改后主表数据._guid

    - 插入数据库

* sample:

  xInput:

  ```
  {
  reqUserID:"pwt"
  userID:"xiao"
  pageID:"xxx-yyy-zzz"
  }，
  ```

  ​



##### api/PAGE/createPage.js
创建模板，

* xInput 参数
  * userID，关联的user角色，表示此对客展示页是属于此user用户的，创建模版不需要此属性
  * name，模板名称
  * isActive，是否激活
  * userGroupIDs（数组），可使用的分组ID集合
  * branchIDs（数组），可使用的分店ID集合
  * type，页面类型，"login" 登录页 / "content" 显示内容页
  * navItems（[{ID,name,orderID},...]），导航栏信息，对象数组，每个元素为一个导航标签项目（ID，显示名称，显示顺序）
  * _ownerID:创建人的userID
  * themeID，主体ID
* xOptions 参数，存放所有开关信息
  - isTemplate（1/0），    存在则操作模版表，不存在操作对客展示表
* err 返回
  * connectingFailed
  * saveingFalied

    ​
* data 返回
  * 无
* 实现功能：
   连接dbURL.dbCollection，
     * isTemplate存在，增加以下属性，插入到数据库
         * \_bookID:"UserPage"
       * isTemplate不存在,增加以下属性，插入到数据库
          * \_bookID:"UserPageTemplate"

          ​
* sample:

xInput:

```
{
pageName："模版a1", 
reqUserID:"pwt"
userGroupIDs:["徐家汇分店","九庭分店"],			
pageType:"content"  
navItems:{ID:1,name:"留言",orderID:2},			
_ownerID:"pwt"	

}，
```



##### api/PAGE/readPage.js
读取一个模板,及模版下的所有组件明细

* input 参数

  * userID，用户帐号
  * pageID，模板guid

* xOptions 参数，存放所有开关信息

  - isTemplate（1/0），  存在则操作模版表，不存在操作对客展示表

* err 返回

  * connectingFailed
  * pageNotFound

* data 返回

  * 主记录所有信息，参见 design/meta.md  UserPage
  * name:模板名称
  * isActive,此对客展示页是否激活
  * userGroupIDs（数组），可使用的分组ID集合
  * type，页面类型，"login" 登录页 / "content" 显示内容页
  * navItems（[{ID,name,orderID},...]），导航栏信息，对象数组，每个元素为一个导航标签项目（ID，显示名称，显示顺序）
  * pageDetails：[{    子记录所有信息，参见 design/meta.md UserPageDetails
     * navItemID，导航标签项目ID，当前组件属于哪个导航标签下显示
     * indent，缩进大小 
     * orderID，排序ID
     * isExpanded（1/0）， 是否展开
     * compoHTMLTag，前端组件HTML标签名，例如："leia-text"
     * pageDetailID，组件明细的guid
     * optionGroupName，候选分类名称，为空则不为候选项。不为空时，候选分类名称可用来分组所有候选项，用户添加新明细时，可根据分组方便选出各种已存在的明细记录
     * compoProps（对象），组件私有的全部属性  例如，{text:"这是一段文本"}

    }]  ，此模版下所有的组件明细信息

* 连接dbURL.dbCollection，

  - isTemplate存在,返回对客展示中的记录及子记录，查询条件

    - 主表记录
      - \_guid:xInput.pageID,
      - \_bookID:"UserPage"
    - 子表记录
      - FK_UserPage_guid:xInput.pageID,
      - \_bookID:"UserPageDetail"

  - isTemplate不存在，返回模版表中的记录及子记录，查询条件
    - 主表记录
      - \_guid:xInput.pageID,
      - \_bookID:"UserPageTemplate"
    - 子表记录
      - FK_UserPageTemplat_guid:xInput.pageID,
      - \_bookID:"UserPageTemplateDetail"

    ​

    ​

* sample:

  xInput:

  ```
  {
  reqUserID
  userID："xiao",    		
  pageID:"xxxx-yyyy-zzz"						
  }，
  ```

  data:

  ```
  - pageName:"模版1"
  - userGroupIDs:["徐家汇分店",...]
  - pageType:"content"
  - navItems:[{ID:1,name:"评论",orderID:2},...]
  - components：[{   
    - userID:"pwt"
    - pageID:"xxx-yyy-zzz"
    - navItemID:1
    - indent:0 
    - compoHTMLTag:"text"
    - pageDetailID:"xxxx-yyy-zzz"
    - orderID:1
    - isExpanded：1
    - compoProps{text:"你好",....}

    },....]  

  ```

  ​

  ​


##### api/PAGE/updatePage.js
更新模板

* input 参数

  * userID，用户帐号
  * pageID，模版_guid 
  * name，模板名称
  * isActive，是否激活，admin决定模版是否可用，op决定user激活的是哪个页面
  * userGroupIDs（数组），可使用的分组ID集合
  * branchIDs（数组），可使用的分店ID集合
  * navItems（[{ID,name,orderID},...]），导航栏信息，对象数组，每个元素为一个导航标签项目（ID，显示名称，显示顺序）
  * themeID，主题ID
* xOptions 参数，存放所有开关信息
  - isTemplate（1/0 ），  存在则操作模版表，不存在操作对客展示表
* err 返回
  * connectingFailed
  * saveingFalied
* data 返回

  * 无
* 实现功能：
   连接dbURL.dbCollection

     * isTemplate存在，修改记录，筛选条件

       - \_bookID:"UserPage"
       - _guid:xInput.pageID

     * isTemplate不存在, 修改记录，筛选条件

       * \_bookID:"UserPageTemplate"
       * _guid:xInput.pageID

       ​

  ​

* sample:

  xInput:

  ```
  {
  pageID:"xxx-yyy-zzz"
  name："模版a1",    		
  userGroupIDs:["徐家汇分店","九庭分店"],			
  type:"content"  
  navItems:{ID:1,name:"留言",orderID:2},			
  _ownerID:"pwt"				
  }，
  ```

  ​

##### api/PAGE/deletePage.js
假删除模板，把模版设为未激活

* input 参数

  * userID，用户帐号
  * pageID，模板_guid

* xOptions  参数，存放所有开关信息

  - isTemplate（ 1/0），   存在则操作模版表，不存在操作对客展示表

* err 返回

  * connectingFailed
  * saveingFalied

* data 返回

  * 无

* 实现功能

  连接dbUrl.dbCollecion,修改 某个对客展示页的isAtive 为 0

  - isTemplate存在
    - 修改主表记录筛选条件
      - _guid:xInput.pageID,
      - \_bookID:"UserPage"
  - isTemplate不存在
    - 修改主表记录筛选条件
      - _guid:xInput.pageID,
      - \_bookID:"UserPageTemplate"

  ​

* sample:

  xInput:

  ```
  {
  reqUserID:"pwt"
  userID:"xiao",
  pageID:"xxxx-yyy-zzz"
  }，
  ```

  ​








#### 激活模块 (暂缓) 
/api/ACTIVATION/

##### api/ACTIVATION/getActivationCode.js

获取激活码

* xInput 参数 （对象） 

  * userInfo（任意对象）:任何可扩展的，付费用户的信息，包括电话，邮件...
  * payInfo (任意对象) :任何可扩展的付款信息，如获取途径，付费方式，付费金额...

* err 返回
  *  "connectingFailed",连接数据库失败 
  *  "savingFailed",保存信息错误
  *  "activationCodeNotFound"，缺少激活码

*  data 返回 
   *  激活码

* 实现功能：
   连接dbURL.dbCollection，筛选条件是【_bookID】为【activationCodeList】，以及【status】为"reserved"【未发放】的第一条数据。
   * 如果记录不存在，err返回 "activationCodeNotFound"

   * 如果记录存在，更新该记录

     * 【status】为"released"【已发放】

       ​

* sample:

xInput:

	{
	userInfo:{
	userName:pwt,
	tel:1543684522,
	Mail:12342@qq.com}
	payInfo:{
	amount:500	
	payWay:"支付宝"
	getWay:"微博"
	
	}
		
	}

data:

	xCallBack("","3107b44c-2236-516d-bb78-611d02586f50")

​	

##### api/ACTIVATION/signMachineCode.js

获取验证加密后的机器特征码

* xInput 参数 （对象） 
  * activationCode,激活码
  * activationInfo(任意对象)，可任意扩展的，激活信息，如机器特征码，激活时间...
* err返回
  *  "connectingFailed",连接数据库失败
  *  "savingFailed",保存信息错误
  *  "activationCodeNotFound",激活码不存在
  *  "activationLimitReached":激活码超过使用次数
* data返回
  *无 	
* 实现功能：
  连接dbURL.dbCollection，筛选条件是【_bookID】为【activationCodeList】，以及【status】为【released】，【activationCode】为xInput.activationCode 的数据，
  * 若记录不存在，err返回"activationCodeNotFound"
  * 若记录存在，
    * 记录.最大使用次数<=记录.已使用次数,err返回"activationLimitReached"
    * 记录.最大使用次数>记录.已使用次数,记录.已使用次数+1，增加记录
      * "_bookID":"activationDetail"
      * "_guid": chance.guid()
      * "_ownerID": xInput.ownerID
      * "_whenCreated"：new Date()
      * "FK_activationCodeList_guid"： 记录._guid

      插入到 dbCollection中 
* sample:

xInput:

	{
	activeInfo:{
	computerID:{cpu:"xxx",homeName:"xxx"}
	time:"2017-10-10 20:14:24"
	userID:"pwt"
	}
	activeCode:"3107b44c-2236-516d-bb78-611d02586f50"
	}




