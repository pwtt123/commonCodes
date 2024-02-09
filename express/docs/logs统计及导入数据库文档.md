# 一，下载文件
1，拷贝**expressCMS\tools\count**下的
**countLogsFromMongodb.js**
和
**count-saveJS-remove.js**

2，拷贝**expressCMS\test**下的**count-saveJS-removeLogs.cmd**以及 **countFromMongodb.cmd**
# 二，启动mongodb

# 三，设置count-saveJS-removeLogs.cmd
count-saveJS-removeLogs.cmd 的作用是，读取选定文件夹中的所有JSON文件，生成一个导入数据库的(\_COUNT\_TARGET+Data.js)logsData.js文件,同时把读取完的JSON文件移入一个新的文件夹，按任意键继续后，把生成的js导入数据库，

## 参数

### 进入count目录
cd ../tools/count
### \_PATH\_SAVE\_JS:生成的js
set "\_PATH\_SAVE_JS=..\\..\\test"

### \_PATH\_DATA\_ROOT:读取文件的文件夹地址
set "\_PATH\_DATA\_ROOT=..\\..\\test\dataRoot"

### \_PATH\_IMPORTED\_DIR:文件移入的文件夹地址
set "\_PATH\_IMPORTED\_DIR=..\\..\\test\\importedLogs"

### \_COUNT\_TARGET: 文件类型：logs/comments/accounts
set "\_COUNT\_TARGET=logs"



### 进入mongodb目录
cd C:\Program Files\MongoDB\Server\3.4\bin 

### 把生成的js文件导入数据库
mongoimport --db counts --collection logs  C:\pwt\SVNprojects\expressCMS\test\logsData.js

# 四，设置countFromMongodb.cmd

countFromMongodb.cmd的作用是，连接数据库，统计对应数据库和collection下的记录,会在命令行中打出统计的数字，并生成countDataFromMongodb.json文件

## 参数
### 进入count目录
cd ../tools/count

### \_SERVER：设置服务器，端口号，是否自动重连
若第三个参数为false,则不自动重连，否则会自动重连

set "\_SERVER=localhost:27017:true"


###  \_DB :设置查询的数据库名
set "\_DB=counts"
### \_COLLECTION: 设置查询的表名
set "\_COLLECTION=logs"


### \_MAX_TIME:设置查询的时间范围的最大值
set "\_MAX\_TIME=2017-09-02 09:30:58"
### \_MIN_TIME:设置查询的时间范围的最小值
set "\_MIN\_TIME=2017-08-01 09:30:58"

### \_NUM\_TOP\_LOGIN：设置按用户登录数排序统计的数量
set "\_NUM\_TOP_LOGIN=2"

### \_NUM\_TOP\_USER：设置按登录次数排序统计的数量
set "\_NUM\_TOP\_USER=3"

### \_PATH\_SAVE\_JSON：保存文件的地址
set "\_PATH\_SAVE\_JSON=..\\..\\test"

# 五，执行命令行
若想把文件信息导入数据库，并清除文件，执行count-saveJS-removeLogs.cmd

若想统计数据库已有的数据，修改条件参数后，执行countFromMongodb.cmd