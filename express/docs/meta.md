

[TOC]



# ECMS后台 bizLyst 表结构定义 

##  概述

​	该文档定义当使用bizLyst扩展ECMS时，默认的后台表结构

​	例:存放登录用户信息的 ECMS.api/meta/user.meta.js,

​	如果需要 bizLyst开一个新项目作为ECMS的后台数据管理，可以复制这里的meta使用，也可以在此基础上进行扩展。

## 表结构​定义

### 通用表结构

(所有表都包含)

* _ownerID，创建该记录的用户userID，可以为空

* _whenCreated，记录创建时间

* _whenUpdated,，记录修改时间

* _guid，记录ID

* _bookID，<表名称> eg."User"/"Comment"...

  ​

### User

用户信息表

* userID，用户登录帐号

* userName，用户显示名称

* pwd，用户登录口令

* userInfo(对象)，存放用户个人信息的对象，eg｛age:"23",mail:""...｝

* branchIDs（数组），普通用户时存放其所在的分店的ID集合，管理员时存放其有权管理的分店ID集合。该项可以为空，为空时代表没有分店，所有管理员可以管理“没有分组的”普通用户。

* userGroupIDs（数组)，普通用户时存放其所在的分组的ID集合，管理员时存放其有权管理的分组ID集合。该项可以为空，为空时代表没有分组，所有管理员可以管理“没有分组的”普通用户。

* roles，["user"/"op"/"admin"],  字符串数组， 用户的角色，是"普通用户"、"客服" 还是 "后台",

* memo，备注

   ​

### Comment
评论信息表

（评论时间 可用 通用的 _whenCreated 属性）

* userID ， 评论所关联的用户ID
* replayUserID，回复评论人的userID
* isAdmin， 发表评论的用户是否管理员，默认0
* content，评论内容
* IP，发表评论的用户IP地址


### Log
日志信息表

（日志时间 可用 通用的 _whenCreated 属性）

* userID，写入用户，eg:"pwt"
* data，log信息
* verb，动作分类，eg:"login",
* tag1，标签1
* tag2，标签2
* tag3，标签3
* IP，生成日志信息前端的 IP地址


### UserPageTemplate   

对客展示内容的模版表（此表为主表）

对客展示内容页面表也沿用此表结构

* userID，通用模板时该项为空，具体作为用户页面时，该项为可以使用该页面的用户ID
* name，模板(页面)名称
* branchIDs（数组），可使用的分店ID集合，只有此数组中的分店才能使用此模版，为空则全部分店可使用
* userGroupIDs（数组），可使用的分组ID集合，只有此数组中的分组才能使用此模版，为空则全部分组可使用
* type，页面类型，"login" 登录页 / "content" 显示内容页
* navItems（[{ID,name,orderID},...]），导航栏信息，对象数组，每个元素为一个导航标签项目（ID，显示名称，显示顺序）
* details（子表）： 定义“UserPageTemplateDetails”为明细子表


### UserPageTemplateDetails 

对客展示内容模版的具体构成组件明细表（此表为UserPageTemplate表的子表）

* navItemID， 导航标签项目ID，当前组件属于哪个导航标签下显示

* indent，缩进级数，页面渲染时，根据缩进级数，产生层级结构效果 

* orderID，排序ID

* referenceDetailID，引用的组件明细guid，有此属性的组件明细，不可更改自身属性，显示为引用的组件明细

* isForReferenceOnly，此组件明细是否可被引用，默认 false。若有此参数，则此组件显示标志为不可编辑，普通op添加后页无法更改，数据库中存放此组件的guid

* isExpanded，1/0 渲染时是否默认展开该项以下的缩进内容（子层级结构）

* compoHTMLTag，前端组件HTML标签名，例如："leia-text"

* compoProps（对象），组件私有的属性  例如，{text:"这是一段文本"}

* optionGroupName，候选分类名称，为空则不为候选项。不为空时，候选分类名称可用来分组所有候选项，用户添加新明细时，可根据分组方便选出各种已存在的明细记录

* FK_UserPageTemplate_guid，Template表的guid，作为外键关联主表

  ​

### UserPage

存储为不同用户所展示的页面信息表 （此表为主表）

结构与UserPageTemplate表一致，除了以下项：

* _bookID
* branchIDs（数组），可使用的分店ID集合，当userID为 _group时，作为权限判断条件
* userGroupIDs（数组），可使用的分组集合，当userID为_group时，作为权限判断条件，只有同时满足branchIDs和userGroupIDs的用户可访问此  分组通用 页面
* entryID（字符串），当 userID为 _public 时，作为入口的判断条件，不同的ertryID，代表不同的通用页面，
* optionGroupID，候选项ID，userID为_optionGroup的候选项页中会有此字段，不同的optionGroupID，代表不同的候选项页
* details（子表）， 定义“UserPageDetails”为明细子表

### UserPageDetails  

对客展示页面，具体构成组件的明细表 （此表为UserPage表的子表）

结构和UserPageTemplateDetails一致，除了以下项

* _bookID
* FK_UserPageTemplate_guid改为FK_UserPage_guid：外键关联主表


**（以下暂缓）**

### UserGroup

分组和分店信息表，

* type，"userGroup"/"branch"，是分店还是分组
* name，分店，分组名
* groupInfo，可扩展的分组的信息，{address:“地址”，tel:"电话"}

- memo，备注



### **（暂缓）ActivationCodeList**

激活码仓库表

- activationCode，激活码
- **status**（文本），发放状态，值为： "reserved".未发放/ "released".已发放，
- **maxActivationLimit**，最大使用次数
- **activationTimes**，已使用次数
- userInfo（任意对象），任何可扩展的，付费用户的信息，包括电话，邮件...
- payInfo (任意对象) ，任何可扩展的付款信息，如获取途径，付费方式，付费金额...

​       

### **（暂缓）ActivationDetails**

激活明细表

- activationInfo(任意对象)，可任意扩展的，激活信息，如机器特征码，激活时间...