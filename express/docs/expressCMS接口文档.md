#expressCMS 接口文档

## 权限

决定用户可以访问和操作的范围。

通过 用户信息中包含的属性 ，**“角色组合”**,**“分组组合”** ,**“分店组合”**和 **"可访问用户列表"**来控制。

每次用户登录时，其 角色组合，分店组合 和 分组组合 会被记入session，供接口调用时检查权限使用。

请求getRelatedUserDocs接口时，该用户的 “可访问用户列表” 会被记入 session,供 其它接口调用时，检查其操作对象是否在列表中

### 角色组合

(.role，**数组**，内容为以下3种 角色文本 的组合)

"user" / “op”/ "admin"

* user ， 只能查看自己的内容，并留言
* op，可以查看其分组下全部user的内容，并能留言
* admin，可以查看修改后台记录，包括内容模板，但不能直接访问 user 的内容

### 分组组合

(.userGroupIDs，**数组**，内容为分组ID的组合)

表明当前用户隶属于哪些分组之下



### 分店组合

(.branchIDs，**数组**，内容为分店ID的组合)

表明当前用户隶属于哪些分店之下



### 可访问用户列表

(.accessableUserIDs，数组，内容为 userID 的组合)

op及 user 角色，只能访问 列表中存在的用户帐号





## 请求标准

### 请求名

前端对ECMS的请求名一般为 

请求名“/接口名"+".do"

例如："/register.do", xxxx

###  请求参数

```
{

	参见接口 的 xInput 内容

	options: {
		参见接口 的 xInputOptions 内容

	}

}
```
例如：
```
{
  userID："aa"，
  userName:"xxx",
  options:{
    isSwitch01:1
  }
}
```



## 接口定义

### 用户信息模块 

#### register

* 权限

  * user

    无权限

  * op

    * options.isUpdate 不存在

      有权限

    * options.isUpdate存在，
      * 若userID存在于可访问用户列表中，则有权限
      * 否则无权限

  * admin

    无权限


* 传入参数：
  * userID，帐号，

  * pwd，密码，修改时不用传

  * updatePwd， 修改的密码

  * userName，昵称

  * branchIDs（数组），分店ID

  * userGroupIDs（数组），用户所在分组ID

  * userInfo（对象），用户扩展的信息，如电话，qq。修改时**一级属性以内可只传修改的属性**

    * 修改或增加userInfo的某个属性时，只需传需修改或增加的属性对象即可

      例：

      ```
      userInfo{
        memo1:"修改备注1",
        memo5:"新增备注5"
      }
      ```

      ​

    * 若某属性的【_trashed】 存在，则删除此属性

      例：

      ```
      {
      tel:{_trashed:1}          //删除tel属性
      }
      ```

      ​

    * 若想修改一级以上的对象属性，须传完整的对象

      例：

      ```
      userInfo{
       gallary:{name:"图片名称",class:"图片样式",url:"图片路径.jpg",memo:"即使只修改name也要传完整的所有属性"},
      }
      ```

      ​

  * options（对象），不同的开关会让后端进行不同的操作

    {

    * isUpdate，若传此参数表明 修改用户信息

    }

* 返回参数

  * {}

    ​

* 实现功能

  * userID，pwd不能为空且不能有特殊字符，验证未通过返回｛error:"..."｝
  * options.isUpdate不存在，会新增user用户帐号，成功返回 ｛｝
  * options.isUpdate存在，且 updatePwd 不能为空，密码不正确或验证不通过返回｛error:"..."｝，修改用户传入的信息,未传的信息不会修改，成功修改 返回｛｝

* sample:

in:

```
{
userID："pwt",    		//账号
pwd:"123321",			//密码
updatePwd:"654321",		//修改的密码
userName:"",			//其它信息
mail:""...
}
```

####  login



* 权限，
  * user

    有权限

    * op

      有权限

    * admin

      有权限


* 传入参数

  * userID，账号
  * pwd，密码
* 返回参数

  - userName，用户名
  - roles，用户权限

* 实现功能

  * 传入密码和帐号 ，为空或未注册返回{error:"xxx"}，
  * 通过验证返回 用户的信息 {userName:xxx,role:xxx}
* sample:


in:

```
{
userID:"pwt"		//账号
pwd:"222222"		//密码
}
```

return:

```
{
userName:"pwt",
roles:["admin"]}		//返回的对象

```

#### logout

* 权限

  - user

    有权限

  - op

    有权限

  - admin

    有权限

* 传入参数

  - 无

* 返回参数

  - {}

* 实现功能：

  * 获取请求后，注销session.user,返回{}

#### getRelatedUserDocs 

* 权限
  * user

    有权限

  * op

    有权限

  * admin

    无权限

* 传入参数

  * reqUserID，若有此参数，只返回此userID的信息，并且可访问列表不会改变，否则返回登录用户所有可访问的所有userID数据，覆盖可访问列表

* 返回参数

  * [{

    * userID，帐号
    * userName，昵称
    * _whenCreate，创建时间
    * _ownerID，创建者
    * userInfo（对象），用户的其他信息，例如电话，qq等

    }]

* 实现功能

  * 获取到请求后，验证未通过或出错，返回{error:"xxx"} ，
  * roles为['op']，返回有权管理的所有用户信息
  * roles为['user'],返回自己的用户信息
  * 可管理的用户userID，集合，存放在session.user.accessableUserIDs 中

* sample:

return:

```

[{"userID":"amy","userName":"xxx",...},
{"userID":"pwt","userName":"xxx",...}
...
 ]

```



### 评论模块

#### readComments

- 权限

  - user

    * userID在可访问列表中，有权限
    * 不在可访问列表中，无有权限

  - op

    * userID在可访问列表中，有权限
    * 不在可访问列表中，无有权限

  - admin

    无权限

- 传入参数

  - userID，用户帐号
  - pageNum，页数
  - pageRecsNum，每页的评论数

- 返回参数

  * 评论内容对象数组

- 实现功能

传入userID,验证未通过或出错，返回{error:"xxx"} ，正常返回对应的评论对象
属性有time:评论的时间，content:评论的内容，isAdmin:是管理员的评论会有这个属性，值为true，普通用户没有这个属性

* sample:

in:

```
{
userID:"amy"
pageNum：1
pageRecsNum：20
}
```

return:

```
[{
IP:"::1"
content:"aaa"
isAdmin:true
time:"2017-11-01 16:14:03"
userID:"amy"
_bookID:"Comment"
_guid:"a164d5f8-6a25-51c3-a1ed-f0c50ce2d5df"
_id:"59f9824bebebdb39a40481af"
_whenCreated:"2017-11-01T08:14:03.267Z"
_whenUpdated:"2017-11-01T08:14:03.267Z"
}...
]
```

#### writeComment

- 权限

  - user

    * userID在可访问列表中，有权限
    * 不在可访问列表中，无有权限

  - op

    * userID在可访问列表中，有权限
    * 不在可访问列表中，无有权限

  - admin

    无权限

- 传入参数

  - userID，关联的用户帐号
  - replayUserID，回复者的userID
  - comment，评论内容

- 返回参数

  - {}

- 实现功能

传入userID和评论内容，后端获取用户角色和时间，写入评论json文件，验证未通过或出错，返回{error:"xxx"}，成功写入返回{success:"xxx"}

* sample:

in:

```
{
userID:"pwt"
comment:"这是评论内容"
} 
```

写入JSON文件sample

```
{
"isAdmin":true,
"time":"2017-08-01 17:42:29",
"content":"这是评论内容",
"IP":"102.169.1.102"
}
```



### log模块

####  writeLog

* 权限

  * user

    有权

  * op

    有权

  * admin

    有权

* 传入参数

  - userID，用户帐号
  - verb，log标志文本
  - tag1，标签1
  - tag2，标签2
  - tag3，标签3
  - data（对象），任意对象，存放log的其他相关信息

* 返回参数

  * {}

* 实现功能

  * 后端获取ip和时间，保存log信息，返回{},接近comment


* sample:

in:

```
{
userID
verb:"",
tag1:"",
tag2:"",
tag3:"",
 data: {}
}
```

写入JSON的数据sample:

```
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
```

#### getAUData

* 权限

  * user

    没有权限

  * op

    没有权限

  * admin

    有权

* 传入参数

  * startDate，统计的开始时间     

  * endDate，统计的结束时间

  * frequency（"daily"/"monthly"/"weekly"），统计的频率，按日/月/周 频率统计

* 传出参数

  * 按时间分类的统计的信息对象，每个时间一个属性

* 实现功能：

  - 返回统计结果,只能管理员权限统计

* sample:

  in

```
{
startDate:"2017-07-02 09:30:58",      
endDate:"2017-09-02 09:30:58",
frequency:"daily",
}
```

返回数据

```
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
```

### 

### 分组及分店模块

#### getUserGroups

获取 拥护关联的分组及分店

- 权限

  - user

    无权限

  - op

    有权限

  - admin

    有权限

- 传入参数

  无

- 返回参数

  - [{

    - type，"userGroup"/"branch"，是分店还是分组
    - name，分店，分组名
    - groupInfo，可扩展的分组的信息，{address:“地址”，tel:"电话"}


    - memo，备注
    - _guid，分组key

    }]

- 实现功能

  - 获取到请求后，验证未通过或出错，返回{error:"xxx"} ，
  - 返回op用户可使用的分组及分店，admin返回所有分组及分店

- sample:



return:

```
{
[{"_guid":"xxx-yy-zzz","name":"分店1",type:"branch"},
{"_guid":"xxx-yyy-zzz","name":"分组1",type:"userGroup"}
...
]
}
```

#### createUserGroup

创建分店，分组

权限

- user

  无权限

- op

  无权限

- admin

  有权限


- 传入参数 

  - type（单元素字符串数组），["userGroup"/"branch"]，是分店还是分组
  - name，分店，分组名
  - groupInfo，可扩展的分组的信息，{address:“地址”，tel:"电话"}


  - memo，备注

- 返回参数

  - 无


- 实现功能：
  - 数据库中创建一条 分组记录


- sample:

in:

```
{
- type:"branch"
- name:"分店1"
- groupInfo:{address:“地址”，tel:"电话"}
- memo:"备注"	
}
```

#### updateUserGroup

修改用户信息

权限

- user

  无权限

- op

  无权限

- admin

  有权限


- 传入参数 
  - type，"userGroup"/"branch"，是分店还是分组
  - name，分店，分组名
  - groupInfo，可扩展的分组的信息，{address:“地址”，tel:"电话"}
  - memo，备注
  - groupID，分组的ID


- 返回参数
  - 无
- 实现功能：
  - 数据库更新，某个分组的相关信息
- sample:

in:

```
{
- groupID:"xxx-yyy-zzz"
- type:"branch"
- name:"分店1"
- groupInfo:{address:“地址”，tel:"电话"}
- memo:"备注"	
}
```



### 显示信息模块

#### （弃用）getUserPage

* 权限
  * user

    有权

  * op

    有权

  * admin

    有权

* 传入参数

  * userID，用户帐号

* 传出参数

  * 用户信息数据

* 实现功能：

  * 验证未通过或出错，返回{error:"xxx"} , 
  * 返回userID 文件夹下的数据对象，txt文件返回txt的内容，图片返回web根目录下的图片路径，文件夹递归返回文件夹下的内容对象,多层目录会返回多层嵌套对象

* sample:

  in:

```
{
 userID:"amy" , //想要获取内容的userID
}
```

in:

```
{
 userID:"login" , //特殊的文件名
 isPublic:1          // 1.不需要用戶登录，可访问特殊的公开目录, userID前会自动拼接“_”  //0, default 需要用户登录后才能访问 (例子会访问:"_login")
}
```

return:

```
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
```

####  getPageDocs

* 权限

  - user
    - isTemplate存在，无权
    - isTemplate不存在，ifIncludeInactivePages默认不存在，有权
  - op
    - isTemplate存在，
      - branchID,在 分店组合中，有权
      - 不在 分组组合中，没有权限
    - isTemplate不存在
      - userID在可访问列表中，有权
      - 不在可访问列表中，没有权限
  - admin
    - isTemplate存在，有权
    - isTemplate不存在，没有权限

* 传入参数(userID,branchID 只需传一个)

  - branchID，op角色选择的  user角色 所在的分店ID，获取所有此分店可使用的模版

  - userID，user用户帐号，获取此userID的对客展示页

  - options（对象），不同的开关会让后端进行不同的操作{

    - isTemplate: 1/0   存在则操作模版表，不存在操作对客展示表

    - ifIncludeInactivePages，是否包含未激活的页面记录，不存在只返回激活的记录，存在则返回所有的记录，

      }

* 传出参数

  - [{

    - pageID， 模版的_guid

    - pageName， 模版名称

    - pageType，模版的分类 

      },

      ...]

* 实现功能

  * 获取 对客展示页 ID集合，
  * user角色只能获取自己的对客展示页，
  * op角色可以获取某个分店可使用的模版，以及某个用户的对客展示页，
  * admin角色可以获取所有模版，




####  clonePage

* 权限

  - user

    无权限

  - op

    - ifCloneAsTemplate  存在，无权限
    - ifCloneAsTemplate  不存在
      - userID,在可访问用户列表中，有权限
      - userID不在列表中，没有权限

  - admin

    - isFromTemplate 不存在，没有权限

    - isFromTemplate 存在

      - ifCloneAsTemplate  存在，有权限
      - ifCloneAsTemplate  不存在，没有权限

      ​

* 传入参数

  * userID，"user"角色的帐号，操作模版时可以不传

  * pageID，复制模版的guid

  * options（对象），不同的开关会让后端进行不同的操作

    {

    * isFromTemplate , 是否复制模版表的记录

    * ifCloneAsTemplate  ,   是否复制到模版表

      }

* 传出参数

  * {}

* 实现功能

  复制一个对客展示页 记录及 子记录 ，新增到数据库，

  ​

####  createPage

* 权限

  - user

    无权限

  - op

    * isTemplate存在，无权限
    * isTemplate不存在，
      * userID，在可访问用户列表中，有权限
      * 不在可访问用户列表中，没有权限

  - admin

    - isTemplate存在，有权限
    - isTemplate不存在，无权限

    ​

* 传入参数

  * userID，关联的user角色，表示此对客展示页是属于此user用户的，创建模版不需要此属性

  * name，模板名称

  * isActive（[1/0]）， 是否激活，默认

  * branchIDs（数组），可使用的分店ID集合，只有在创建模版才会用到

  * userGroupIDs（数组），可使用的分组ID集合，只有在创建模版才会用到

  * type（"login" / "content"），页面类型，登录页 / 显示内容页

  * navItems（对象数组），导航栏信息，每个元素为一个导航标签项目（ID，显示名称，显示顺序）

    例：[{ID:"",name:"",orderID:""},...]

  * _ownerID，创建人的userID

  * themeID，主体ID

  * options（对象），不同的开关会让后端进行不同的操作{

    * isTemplate: 1/0   存在则操作模版表，不存在操作对客展示表

      }

* 传出参数

  * {}

* 实现功能

  * 创建模板，

####  readPage

* 权限

  - user
    * isTemplate存在，无权
    * isTemplate不存在
      * userID在可访问列表中，有权
      * 不在可访问列表中，没有权限
  - op
    * isTemplate存在，
      * userGroupID,在 分组组合中，有权
      * 不在 分组组合中，没有权限
    * isTemplate不存在
      * userID在可访问列表中，有权
      * 不在可访问列表中，没有权限
  - admin
    * isTemplate存在，有权
    * isTemplate不存在，没有权限

* 传入参数

  * userID，用户userID

  * branchID，模版所在分组

  * pageID，模板guid

  * options（对象），不同的开关会让后端进行不同的操作

    - isTemplate: 1/0   存在则操作模版表，不存在操作对客展示表

      }

* 传出参数

  * 对客展示及组件明细所有数据

* 实现功能

  读取一个模板,及模版下的所有组件明细



####  updatePage

* 权限

  - user

    无权限

  - op

    - isTemplate存在，无权限
    - isTemplate不存在，
      - userID，在可访问用户列表中，有权限
      - 不在可访问用户列表中，没有权限

  - admin

    - isTemplate存在，有权限
    - isTemplate不存在，无权限

* 传入参数

  * pageID，模版_guid 

  * name，模板名称

  * isActive（[1/0]），是否激活，admin决定模版是否可用，op决定user激活的是哪个页面，

  * branchIDs（字符串数组），可使用的分店ID集合,只有在修改模版才会用到

    例：["徐家汇分店","",....]

  * userGroupIDs（数组），可使用的分组ID集合，只有在创建模版才会用到

  * navItems（对象数组），导航栏信息，对象数组，每个元素为一个导航标签项目（ID，显示名称，显示顺序）

    * 若修改，须传完整的所有navItems数据

    例：[{ID:"",name:"",orderID:""},...]

  * themeID，主题ID

  * options（对象），不同的开关会让后端进行不同的操作

    - isTemplate: 1/0   存在则操作模版表，不存在操作对客展示表

      }

* 传出参数

  * {}

* 实现功能

  更新模板

  ​

#### deletePage

* 权限

  - user

    无权限

  - op

    - isTemplate存在，无权限
    - isTemplate不存在，
      - userID，在可访问用户列表中，有权限
      - 不在可访问用户列表中，没有权限

  - admin

    - isTemplate存在，有权限
    - isTemplate不存在，无权限

* 传入参数

  * userID，用户帐号

  * pageID，模板_guid

  * options（对象），不同的开关会让后端进行不同的操作

    - isTemplate: 1/0   存在则操作模版表，不存在操作对客展示表

      }

* 传出参数

  * {}

* 实现功能
  假删除模板，把模版设为未激活

  ​

  ​


#### signUploadPolicy

- 权限

  - user

    无权限

  - op

    - isTemplate存在，没有权限
    - isTemplate不存在
      - userID在可访问列表中，有权
      - 不在可访问列表中，没有权限
    - admin
      - isTemplate存在，有权
      - isTemplate不存在，没有权限

- 传入参数

  - userID，用户帐号，上传 对客展示页 文件时，要传

  - pageID，模板_guid

  - extName，文件后缀名

  - fileName，文件名

  - vendor，云存储供应商 

    例："aliyun"/""....

  - type（"page"/"user"），上传的类型 

    * page,以pageID，作为文件命名的一部分, 一般修改页面图片 使用
    * user,以userID，作为文件命名的一部分,一般上传用户 头像 使用

  - options（对象），不同的开关会让后端进行不同的操作

    - isTemplate: 1/0   存在则操作模版表，不存在操作对客展示表

      }

- 传出参数

  - filePath，服务器存放文件的路径，结合主机名，可形成完整的路径

    例：“file/testPageID/43e3e9f0-c418-5e8e-acba-5c7579972d11/baby.jpg”

  - policy（对象），签名内容对象

  - policyBase64，base64 编码的policy

  - signature，policy的 签名

- 实现功能

  上传文件前调用 返回签名 后的文件信息及key，通过返回的信息来通过验证，上传文件

- sample

in

```
{
userID:"xiaoming",
pageID:"xxx-yyy-zzz",
extName:zExtName,
fileName: zFileName,
vendor: "aliyuncs",
type: "page"
}
```



return

```
{
filePath:"file/testPageID/43e3e9f0-c418-5e8e-acba-5c7579972d11/baby.jpg",

policy:{expiration: "2017-11-07T07:12:12.505Z", conditions: Array(2)},

policyBase64:"eyJleHBpcmF0aW9uIjoiMjAxNy0xMS0wN1QwNzoxMjoxMi41MDVaIiwiY29uZGl0aW9ucyI6W1siZXEiLCIka2V5IiwiZmlsZS90ZXN0UGFnZUlELzQzZTNlOWYwLWM0MTgtNWU4ZS1hY2JhLTVjNzU3OTk3MmQxMS9iYWJ5LmpwZyJdLFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLDAsMTA0ODU3Nl1dfQ=="

signature:"0nxdC57S5fSKhcOWMo81nJ1dlfg="
}
```

### 组件明细模块

#### createPageDetail



参数：

- 权限

  - user

    无权限

  - op

    * isTemplate存在，无权限
    * isTemplate不存在，
      * userID存在可访问用户列表中，有权限
      * 不存在列表中，无权限

  - admin

    - isTemplate存在，有权限
    - isTemplate不存在，无权限

    ​

- 传入参数

  - userID，用户帐号

  - pageID，模板的_guid,

  - referenceDetailID，引用的组件明细guid，有此属性的组件明细，不可更改自身属性，显示为引用的组件明细

  - isForReferenceOnly，此组件明细是否可被引用，默认 false。若有此参数，则此组件显示标志为不可编辑，普通op添加后页无法更改，数据库中存放此组件的guid

  - navItemID，导航标签项目ID，当前组件属于哪个导航标签下显示

  - indent，缩进大小

  - compoHTMLTag，前端组件HTML标签名，

    例："leia-text"

  - orderID，排序ID

  - isExpanded（1/0）， 是否展开

  - compoProps（对象），组件私有的属性 ，多元素属性存放

    - 若某个属性为多元素的，存放对象，ID作为key,orderID决定排序

    例：{title:"这是一段文本",

    ​	values:{value1:{text:"图片1",url:"url1",orderID:1},value2:{...}...}

  - optionGroupName，候选分类名称，为空则不为候选项。不为空时，候选分类名称可用来分组所有候选项，用户添加新明细时，可根据分组方便选出各种已存在的明细记录

  - _ownerID，创建人的userID

  - options（对象），不同的开关会让后端进行不同的操作  {

    - isTemplate: 1/0   存在则操作模版表，不存在操作对客展示表

      }

- 传出参数

  - {}

- 实现功能

  创建组件明细

#### updatePageDetail



参数：

- 权限

  - user

    无权限

  - op

    * isTemplate存在，无权限
    * isTemplate不存在，
      - userID存在可访问用户列表中，有权限
      - 不存在列表中，无权限

  - admin

    - isTemplate存在，有权限
    - isTemplate不存在，无权限

- 传入参数

  - userID，用户帐号

  - pageID，对客展示页的guid

  - pageDetailID，组件明细的guid

  - referenceDetailID，引用的组件明细guid，有此属性的组件明细，不可更改自身属性，显示为引用的组件明细

  - isForReferenceOnly，此组件明细是否可被引用，默认 false。若有此参数，则此组件显示标志为不可编辑，普通op添加后页无法更改，数据库中存放此组件的guid

  - navItemID，导航标签项目ID，当前组件属于哪个导航标签下显示

  - indent，缩进大小 

  - compoHTMLTag，前端组件HTML标签名，

    例："leia-text"

  - orderID，排序ID

  - isExpanded（1/0）， 是否展开

  - compoProps（对象），组件私有的属性  ，**二级属性以内可只传一个属性**

    - 添加修改compoProps的某个属性，或者添加修改 compoProps对象属性下的某个属性(二级属性)，只需传一个修改的属性即可

      例：

      ```
      compoProps:{ 

      	title:"标题修改",    
      	values:{  
      		"value5":"新增二级属性"   
      	}
      	}

      ```

      ​

    - 若要删除一级或二级的属性，此属性的【\_trashed】存在，则删除此属性

      例：

      ```
      compoProps：{ 
      	title:{_trashed:1},     //删除title
      	values:{
              value1:{_trashed:1}	  //删除values.value1
      	}
      	}
      ```

      ​

      ​

    - 若修改三级及以上属性，需传全部属性值

      ​

    例：

    ```
    {
    title:"相册",
    class:"相册样式",
    gallary:{
    	gallary2:{name:"图片名称",class:"图片样式",url:"图片路径.jpg",memo:"即使只修改name也要传完整的所有属性"},
    	gallary5:{...}
    	}

    }

    ```

    ​

    ​

  - optionGroupName，候选分类名称，为空则不为候选项。不为空时，候选分类名称可用来分组所有候选项，用户添加新明细时，可根据分组方

  - options（对象），不同的开关会让后端进行不同的操作  {

    - isTemplate: 1/0   存在则操作模版表，不存在操作对客展示表

      }

- 传出参数

  - {}

- 实现功能

  修改组件明细

####  deletePageDetail



- 权限

  - user

    无权限

  - op

    * isTemplate存在，无权限
    * isTemplate不存在，
      - userID存在可访问用户列表中，有权限
      - 不存在列表中，无权限

  - admin

    - isTemplate存在，有权限
    - isTemplate不存在，无权限

- 传入参数

  - userID，用户帐号

  - pageID，模板的_guid

  - pageDetailID，组件明细的guid

  - options（对象），不同的开关会让后端进行不同的操作  {

    - isTemplate: 1/0   存在则操作模版表，不存在操作对客展示表

      }

- 传出参数

  - {}

- 实现功能

  删除组件明细




### 激活模块

#### getActivationCode



- 权限

  - user

    有权限

  - op

    有权限

  - admin

    有权限

- 传入参数

  - userID
  - mail

- 传出参数

  - 激活码

- 实现功能

  传用户信息，返回未使用的激活码，

in

```
{
userID:"",
mail:"",

}
```

return

```
{
success:"3107b44c-2236-516d-bb78-611d02586f50"
}
```

####  signMachineCode

* 权限

  - user

    有权限

  - op

    有权限

  - admin

    有权限

* 传入参数

  * activationCode
  * computerMessage

* 传出参数

  * 签名过的机器特征码

* 实现功能

  获取前端的机器码 以及激活码，判断激活码正确后，读取私钥，加密后返回给前端

in

```
{
activationCode:xxxxxxxxxx
computerMessage:XXX
}
```

return 

```
{
success:"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxx=="
}
```









# 常规流程（未Review）

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



