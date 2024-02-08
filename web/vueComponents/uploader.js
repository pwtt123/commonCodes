<!--
实时上传文件
methods:
  open(xParam) 详见 data 说明
    xParam required props{
    uploadType, 业务类型，
    recId, 文件挂载的记录 id,作为 请求时url为 actionMap[uploadType] + recId
    fileList,已有的文件,
    }
  close()

events
  close(uploadType)


使用sample:

        let zImgUrl = this.taskDetail[xMeta.prop];
        let zImgName = this.taskDetail[xMeta.prop];
        let zParam = {
          recId: "uuid",
          listType: "picture-card",
          uploadType: "task-img",
          fileList: zImgUrl ? [{name: zImgName, url: zImgUrl,id:zImgName}] : []
        };
        this.$refs.dialogUploader.open(zParam);

-->

<template>
  <el-dialog title="文件上传" :modal="ifModalNeed" :visible.sync="ifShow" width='600px' high='600px' @close="onDialogClose">
    <el-upload
      ref="uploader"
      class="avatar-uploader"
      :action="userAction"
      :show-file-list="ifShowFileList"
      :list-type="props.listType"
      :usedLimit="usedLimit"
      :auto-upload='true'
      :before-upload="beforeUpload"
      :on-success="onSuccess"
      :on-change="onChange"
      :on-exceed="onExceed"
      :on-remove="onRemove"
      :before-remove="beforeRemove"
      :on-error="onError"
      :fileList="props.fileList"
      :http-request="httpRequest"
    >
      <div v-if="isLimited" @click.stop="" style="cursor: not-allowed">已达上传上限</div>
      <div v-else>
        <i v-if="props.listType=='picture-card'" class="el-icon-plus avatar-uploader-icon"></i>
        <el-button v-else size="small" type="primary">点击上传</el-button>
      </div>

      <div v-if="props.ifShowTips" slot="tip" class="el-upload__tip">
        只能上传 <strong>{{usedLimit || 0}}</strong> 个 <strong>{{usedExts.join("/")
        || "任意"}}</strong> 文件，
        每个文件不能超过 <strong>{{usedMaxSize | sizeFormat}}</strong>
        <span v-if="settings.rulesMap[props.uploadType]">
          <span v-for="xRule in settings.rulesMap[this.props.uploadType]">，<span
            v-html="_.isFunction(xRule.msg)?xRule.msg():(xRule.msg || '')"></span></span>
        </span>
      </div>

    </el-upload>

    <!--是否需要压缩-->
    <div>
      <el-switch
        v-model="isCompressNeed"
        active-text="压缩图片"
        inactive-text="不压缩图片"
      ></el-switch>

      <div v-if="isCompressNeed" class="uk-text-small uk-text-muted" style="position: relative;top:2px;">
        等比压缩，先设置后上传，压缩后
        <div >最宽为 <el-input style="width: 100px;" v-model="props.compressSetting.maxWidth" size="small"></el-input> 像素
          <span v-if="!props.compressSetting.maxWidth">(不限制宽度)</span>
        </div>
        <div >最高为 <el-input style="width: 100px;" v-model="props.compressSetting.maxHeight" size="small"></el-input> 像素
          <span v-if="!props.compressSetting.maxHeight">(不限制高度)</span>
        </div>
      </div>

    </div>

    <!--用于把测试环境文件上传到生产环境-->
    <div v-if="ifShowUpload2prd"
         :files="JSON.stringify(props.fileList)"
         :action="userAction"
    >
      右击上传全部文件到生产环境（electron 中访问）
    </div>

  </el-dialog>
</template>

<script>
  import _ from "underscore"
  import utils from "@/utils"

  let V_Uploader = {
    // props通过 open()传值,详见 data zDefaultProps
    props: {
      //是否需要遮罩层
      ifModalNeed: {default: true},
    },
    data() {

      let zDefaultProps = {
        //required 限制文件类型对应的后缀名，array/string,
        // options: news-img/salon-img/salon-ppt/salon-attach/task-img/task-attach
        uploadType: "news-img",
        //required 挂载记录的id
        // salonId/taskId/hlId
        recId: "",
        // 已有的文件,参数为file对象参数
        //[{name:"xx",url:"xx"...},...]
        fileList: [],
        //"picture-card"/"picture"/"text"
        listType: "picture-card",
        // 是否显示tips
        ifShowTips: true,

        //压缩之后的最大宽度或最大高度
        //{maxWidth:1082,maxHeight:720}
        //若不传 使用默认值，若无默认值则不压缩
        //算法会等比例压缩图片，直到图片满足 最大宽度和高度（即以 比例较大一方也满足条件为止）
        compressSetting: {maxWidth:800,maxHeight:0},


        //如果传值，使用此作为文件数量限制，否则使用默认的
        limit: 0,
        // 如果传值，使用此作为文件打小限制，否则使用默认的
        size: 0,
        //如果传值，使用此后缀，否则使用默认的
        //["jpg",'png',...]
        exts: [],
      };


      return {
        props: JSON.parse(JSON.stringify(zDefaultProps)),

        defaultProps: zDefaultProps,

        ifShow: false,
        //上传成功文件数
        uploadedFilesNum: 0,
        // 是否展示上传的文件列表
        ifShowFileList: true,

        //数据是否改变
        ifChanged: false,


        //不同业务上传配置
        settings: {
          extsMap: {
            img: ['jpg', 'jpeg', 'png', 'gif'],
            imgList: ['jpg', 'jpeg', 'png', 'gif'],
            ppt: ['ppt', 'pptx'],
            attach: ['jpg', 'jpeg', 'png', 'ppt', 'gif', 'pptx', 'md', 'txt', 'docx', 'doc', 'xlsx', 'xls'],
          },
          //  modType-fileType
          actionMap: {
            "news-img": this.$api.news.url2UploadImg,
            "salon-img": this.$api.salon.url2UploadImg,
            "salon-ppt": this.$api.salon.url2UploadPpt,
            "salon-imgList": this.$api.salon.url2UploadAttach,
            "task-img": this.$api.task.url2UploadImg,
            "task-attach": this.$api.task.url2UploadAttach,
            "taskMember-img": this.$api.task.url2UploadMemberPic,
            "taskIcon-img": this.$api.task.url2UploadIcon,

            //头像
            "userPhoto-img": this.$api.url2UploadUserPhoto
          },
          deleteApiFuncMap: {
            "news-img": this.$api.news.deleteNewsImg,

            "salon-img": this.$api.salon.deleteSalonImg,
            "salon-ppt": this.$api.salon.deleteSalonPpt,
            "salon-imgList": this.$api.salon.deleteSalonAttach,

            "task-attach": this.$api.task.deleteTaskAttach,
            "taskMember-img": this.$api.task.deleteTaskMemberPic,
            "taskIcon-img": this.$api.task.deleteTaskIconPic,
            "task-img": this.$api.task.deleteTaskImg,
          },
          // 除数量以及大小之外的其他限制, 参考 element 表单验证
          // array [{validator:(xFile,xCallback)=>{}，...},...]
          // validator(xFile,xCallback) 验证方法,
          //   xFile:el-upload 组件 before-upload(file) 的file对象
          //   xCallback(err):验证的回调方法,存在err 验证不通过，否则通过
          rulesMap: {
            "news-img": [{
              validator(xFile, xCallback) {
                V_Uploader.methods.getImgWidthAndHeight(xFile, (err, xMsg) => {
                  let zRatio = xMsg.width / xMsg.height;
                  if (err) return xCallback(err);
                  // 验证通过
                  if (this.min <= zRatio && this.max >= zRatio) return xCallback();
                  //未通过
                  xCallback(`宽高比不能为 ${zRatio}`)
                })
              }, msg() {
                return `图片宽高比需在<strong> ${this.min} </strong>到<strong> ${this.max} </strong>之间`
              }, min: 1.5, max: 2.5
            }
            ]
          },
          //默认数量限制
          limitMap: {
            attach: 20,
            imgList: 20,
            ppt: 1,
            img: 1,
          },
          //默认大小限制
          sizeMap: {
            attach: 30 * 1024 * 1024,
            ppt: 30 * 1024 * 1024,
            img: 10 * 1024 * 1024,
            imgList: 10 * 1024 * 1024
          },
        },

        //是否显示上传到生产服务器按钮，
        ifShowUpload2prd: utils.urlQueryString("ifShowUpload2prd", location.search),
        //是否需要压缩图片
        isCompressNeed: true,
        // 用于图片压缩的canvas
        elCanvas: document.createElement("canvas"),
        // 用于图片压缩的img
        elImg: document.createElement("img"),
      };
    },
    computed: {
      //是否 达到上传数量上限
      isLimited() {
        if (!this.props.fileList) return false;
        return this.props.fileList.length >= this.usedLimit
      },

      userAction() {
        return this.settings.actionMap[this.props.uploadType] + this.props.recId
      },

      //img/imgList / ppt /attach
      fileType() {
        return this.props.uploadType.split("-")[1] || "";
      },

      deleteFunc() {
        return this.settings.deleteApiFuncMap[this.props.uploadType]
      },

      // 默认为 1
      usedLimit() {
        if (this.props.limit) return this.props.limit;
        return this.settings.limitMap[this.fileType] || 1;
      },
      // 默认为 5mb
      usedMaxSize() {
        if (this.props.size) return this.props.size;
        return this.settings.sizeMap[this.fileType] || 5 * 1024 * 1024;
      },
      usedExts() {
        if (this.props.exts && this.props.exts.length) return this.props.exts;
        return this.settings.extsMap[this.fileType] || [];
      },
    },
    methods: {
      //打开对话框 并初始化props
      // xProps 详见 data
      open(xProps) {
        //必须有的参数
        if (!xProps || !xProps.uploadType) throw new Error("uploadType not found");
        // props 设为初始值
        this.props = _.clone(this.defaultProps);
        //props传参
        _.extend(this.props, xProps);

        this.ifShow = true;
      },
      close() {
        this.ifShow = false;
      },

      //获取图片宽高
      getImgWidthAndHeight(xFile, xCallback) {
        let zImg = new Image();
        zImg.onload = () => {
          let zMsg = {height: zImg.height, width: zImg.width};
          if (_.isFunction(xCallback)) xCallback(null, zMsg)
        };
        zImg.onerror = (e) => {
          if (_.isFunction(xCallback)) xCallback(e)
        };
        let _URL = window.URL || window.webkitURL;
        zImg.src = xFile.url = _URL.createObjectURL(xFile)

      },

      onDialogClose() {
        this.$emit("close", this.ifChanged)
      },
      onExceed(file, fileList) {
        console.log("onExceed", file, fileList)
      },

      onPreview(file) {
        console.log("onPreview", file)
      },

      onRemove(file, fileList) {
        console.log("onRemove", file, fileList);

        this.props.fileList = fileList;
      },

      beforeRemove(file, fileList) {
        console.log("beforeRemove", file);
        // 非 success 状态 全部 允许删除
        if (file.status !== "success") return true;
        // 存在 删除 方法，confirm 后 删除图片
        if (this.deleteFunc) {
          return this.$confirm(this.$settings.msgMap.confirmDeleteFile)
            .then(() => {
              this.ifChanged = true;
              let zReq = {recId: this.props.recId, fileId: file.id};
              return this.deleteFunc(zReq)
            })
            .then((xRes) => {
              console.log("deleteFile", xRes);
              this.$message.success(this.$settings.msgMap.successDeleteFile);
            })
            .catch((e) => {
              console.log("err", e);
              // if(e!="cancel")this.$message.error(this.$settings.errMap.deleteFileFailed);
              throw new Error("doRej")
            });
        }


        //   不存在 删除 方法
        // this.$message.warning(this.$settings.msgMap.warningFileNeedUpload2Cover);
        return true
      },

      onChange(file, fileList) {
        console.log("onChange", file, fileList);
        this.props.fileList = fileList;
      },
      onSuccess(res, file) {
        console.log("onSuccess", res, file);
        this.ifChanged = true;
        file.id = res.result.id;
        this.$message.success(this.$settings.msgMap.successUpload)
      },
      onError() {
        this.$message.error(this.$settings.errMap.uploadFailed)
      },
      beforeUpload(xFile) {
        console.log("beforeUpload", xFile, xFile.height);
        //检查原文件是否合法
        return new Promise((resolve, reject) => {
          let zExt = xFile.name.substr(xFile.name.lastIndexOf(".") + 1).toLowerCase();
          if (!_.contains(this.usedExts, zExt)) {
            // console.log("zExt", zExt, this.usedExts)
            this.$message.error(this.$settings.msgMap.errUploadFileExts);
            return reject()
          }
          if (xFile.size > this.usedMaxSize) {
            // console.log("zExt", zExt, this.usedExts)
            this.$message.error(this.$settings.msgMap.errUploadFileSize);
            return reject()
          }
          //其他规则
          let zRules = this.settings.rulesMap[this.props.uploadType] || [];

          //转为promise 执行
          zRules = _.map(zRules, (xRule) => {
            return new Promise((xxResolve, xxReject) => {
              xRule.validator(xFile, (err) => {
                if (err) {
                  return xxReject(err)
                }
                xxResolve()
              });
            })
          });

          Promise.all(zRules)
            .then(resolve)
            .catch((err) => {
              this.$message.error(err);
              reject(err)
            });

        });


      },

      httpRequest(xOptions) {
        console.log("httpRequest", xOptions);

        let zGetCompressedFile = () => {
          return new Promise((resolve, reject) => {
            //不需要压缩直接返回 原file
            if (!this.isCompressNeed) return resolve(xOptions.file);

            this.compressFile(xOptions.file, (xFile) => {
              console.log("compressFile", xFile);
              resolve(xFile)
            });
          });
        };

        return zGetCompressedFile()
          .then((xFile) => {
            // action
            let zFormData = new FormData();
            zFormData.append('file', xFile);
            // console.log("zFormData",zFormData)
            return this.$api.uploadFile(xOptions.action, zFormData)
          });

      },

      //压缩文件
      //xFile ,File对象
      //xCallback(xNewBlob),若出错返回原xFile
      compressFile(xFile, xCallback) {
        try {
          //非图片
          if (!xFile || !xFile.type) {
            if (_.isFunction) return xCallback(xFile)
          }

          // 图片类型压缩
          if (/image\//.test(xFile.type)) {
            console.log("imageTypeFile", xFile);

            let zFileName=xFile.name;
            // this.readBlobAsDataURL(xFile, (xDataUrl) => {  });
            let zElCanvas = this.elCanvas;
            let zElImg = this.elImg;
            zElImg.src = URL.createObjectURL(xFile);
            zElImg.onload = () => {
              // console.log("imageLoaded")
              let ctx = zElCanvas.getContext("2d");
              let originWidth = zElImg.width;
              let originHeight = zElImg.height;
              let ratio = originWidth / originHeight;
              // console.log("origin",originWidth,originHeight,ratio)
              let zMaxWidth = this.props.compressSetting.maxWidth || 999999999;
              let zMaxHeight = this.props.compressSetting.maxHeight || 999999999;
              // console.log("max",zMaxWidth,zMaxHeight)

              let targetWidth = zMaxWidth > originWidth ? originWidth : zMaxWidth;
              let targetHeight = zMaxHeight > originWidth ? originHeight : zMaxWidth;
              //以比例较大的一方也满足条件为止
              if (ratio > targetWidth / targetHeight) {
                targetHeight = targetWidth / ratio
              } else {
                targetWidth = targetHeight * ratio
              }

              // console.log("target",targetWidth,targetHeight,targetWidth/targetHeight);


              zElCanvas.width = targetWidth;
              zElCanvas.height = targetHeight;
              // 清除画布
              ctx.clearRect(0, 0, targetWidth, targetHeight);
              //图片压缩
              ctx.drawImage(zElImg, 0, 0, targetWidth, targetHeight);

              let zNewUrl = zElCanvas.toDataURL('image/jpeg', 0.90);
              // console.log("newUrl", zNewUrl)
              let zNewBlob = this.dataURL2Blob(zNewUrl,zFileName,{type: 'image/jpg'});
              // console.log("zNewBlob",zNewBlob)
              if (_.isFunction) return xCallback(zNewBlob);
            };
            return;
          }

          xCallback(xFile)

        } catch (e) {
          if (_.isFunction) xCallback(xFile)

        }


      },

      //把blob 转为 base64数据
      //xBlob: blob 对象
      //callback(base64Date)
      readBlobAsDataURL(xBlob, callback) {
        let zReader = new FileReader();
        zReader.onload = (xEvent) => {
          callback(xEvent.target.result)
        };
        zReader.readAsDataURL(xBlob)
      },

      //dataUrl :base64 数据
      // xOptions: new Blob 的 第二个参数
      dataURL2Blob(dataUrl,zFileName,xOptions) {
        console.log("dataURL2Blob",xOptions);
        let arr = dataUrl.split(','),
          mime = arr[0].match(/:(.*?);/)[1],
          bstr = atob(arr[1]),
          n = bstr.length,
          u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n)
        }

        //返回新文件对象，不支持返回blob对象
        try{
          return new File([u8arr],zFileName,xOptions)
        }catch(e){
          return new Blob([u8arr], xOptions)
        }

      }


    },

  };

  export default V_Uploader
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
  .avatar-uploader .el-upload {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .avatar-uploader .el-upload:hover {
    border-color: #409EFF;
  }

  .avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 148px;
    height: 148px;
    line-height: 148px;
    text-align: center;
  }

  .avatar {
    width: 148px;
    height: 148px;
    display: block;
  }
</style>

