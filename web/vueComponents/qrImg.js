<!--二维码图片

:imgData.sync:生成的二维码图片url
-->

<template>
  <div class="uk-text-center" style="display: inline-block;">
    <img ref="qrImg" :src="imgData" style="height: 100%;">
    <a v-if="ifDownloadShow"
       class="uk-link uk-position-center-right uk-margin-large-right"
       title="点击下载"
       :href="imgData" :download="imgData">
      点击下载
    </a>
  </div>
</template>
<script>
  import QRCode from 'qrcode'

  export default {
    props: {
      //二维码字符
      qrStr: {default: ""},
      // 二维码上方标题
      title:{default:""},
      // 二维码下方描述
      description: {default: ""},

      //二维码中间icon url
      icon:{default:""},

      //二维码图片周边留白
      padding:{default:10},
      //标题高度
      titleFontSize:{default:15},
      //标题和二维码的间隔
      titleMarginBottom:{default:2},
      titleStyle:{default:"black"},

      // 描述高度
      descFontSize: {default: 15},
      // 描述 和 二维码 间隔
      descMarginTop: {default: 0},
      descStyle:{default:"black"},

      ifDownloadShow: {default: false}
    },
    data() {
      return {
        elCanvas: document.createElement("canvas"),
        elImg: document.createElement("img"),
        elIconImg:document.createElement("img"),
        imgData: ""
      }
    },
    mounted() {
      this.setQrImgSrc();
    },
    methods: {
      setQrImgSrc() {
        if (!this.qrStr) return this.$refs.qrImg.src = "";
        QRCode.toDataURL(this.qrStr)
          .then(url => {
            // console.log("qrStr",url);
            // this.$refs.qrImg.src=url
            // 二维码图片
            this.elImg.src = url;
            this.elImg.onload = () => {
              let ctx = this.elCanvas.getContext("2d");
              this.elCanvas.width = this.elImg.width+this.padding*2;
              this.elCanvas.height = this.elImg.height+this.padding*2+10 ;
              if(this.title) this.elCanvas.height+=(this.titleFontSize+this.titleMarginBottom);
              if(this.description) this.elCanvas.height+=(this.descFontSize+this.descMarginTop);

              // console.log("elCanvas.height",this.elCanvas.height);
              //当前绘制的高度
              let currentHeight=this.padding;
              // 增加背景色
              ctx.fillStyle = "white";
              ctx.fillRect(0, 0, this.elCanvas.width, this.elCanvas.height);

              //增加标题字段
              ctx.fillStyle = this.titleStyle;
              ctx.font = this.titleFontSize + "px Georgia";
              let zTitleStart =this.padding+( this.elImg.width / 2 - this.title.gblen() * this.titleFontSize / 4);
              ctx.fillText(this.title, zTitleStart, currentHeight+this.titleFontSize );
              if(this.title)currentHeight+=this.titleFontSize;

              //增加二维码
              if(this.title)currentHeight+=this.titleMarginBottom;

              // console.log("elImg.height",currentHeight);
              ctx.drawImage(this.elImg, this.padding, currentHeight, this.elImg.width, this.elImg.height);

              let zGetIconData=()=>{
                return new Promise((resolve,reject)=>{
                  //增加icon
                  if(this.icon){
                    this.elIconImg.src=this.icon;
                    this.elIconImg.onload=()=>{
                      resolve()
                    }
                  }else{
                    resolve()
                  }
                })
              };

              zGetIconData().then(()=>{
                if(this.icon){
                  let zIconImgWidth=this.elImg.width*1/4;
                  let zIconImgHeight=this.elImg.width*1/4;
                  ctx.drawImage(this.elIconImg, this.padding+ this.elImg.width/2  - zIconImgWidth/2, currentHeight + this.elImg.height/2 - zIconImgHeight/2, zIconImgWidth,zIconImgHeight);

                }

                currentHeight+=this.elImg.height;


                // 增加 描述字段
                if(this.description)currentHeight+=this.descMarginTop;
                ctx.fillStyle = this.descStyle;
                ctx.font = this.descFontSize + "px Georgia";
                let zFontStart = this.padding+(this.elImg.width / 2 - this.description.gblen() * this.descFontSize / 4);
                ctx.fillText(this.description, zFontStart, currentHeight+this.descFontSize);
                if(this.description)currentHeight+=this.descFontSize;
                //获取图片数据
                let zImgData = this.elCanvas.toDataURL();

                this.imgData = zImgData;
                this.$emit('update:imgData',zImgData)
              });


            };

          })
          .catch(err => {
            // console.log("err",err);
            this.$refs.qrImg.src = ""
          })
      },

    },
    watch: {
      qrStr() {
        this.setQrImgSrc();
      }
    }
  }
</script>
