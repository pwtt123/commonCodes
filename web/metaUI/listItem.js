<!--按照 settings中 meta 规则 渲染的列表每一项 -->
<!--
slots
  left
  right
-->
<template>
  <li class="uk-inline uk-margin-bottom"
      style="min-height: 1.5em;margin-top:0"
      :style="{'padding-left':noLabel?'20px':labelWidth+20+'px'}">
    <!--icon-->
    <div class="uk-position-top-left " style="top:-3px;margin-left: 20px">
      <img style="max-width:20px; " v-if="icon" :src="icon" alt="">
      <img style="max-width:20px; " v-if="meta.icon && !icon" :src="meta.icon" alt="">
      <slot name="left"></slot>
    </div>
    <!--label-->
    <div v-if="!noLabel" class="uk-h5  uk-text-right uk-position-top-left " style="margin: 0 0 0 20px;" :style="{'width':labelWidth+'px'}">
      <span>{{label}}</span><span v-if="!label">{{meta.label}}</span> ：
    </div>

    <!--right-->
    <div class="uk-float-right">
      <slot name="right"></slot>
    </div>

    <div v-if="value">{{value}}</div>

    <!--main-->
    <div v-if="getObjValue(data,meta.prop)!=null" class="" >

      <!--数子类型-->
      <span v-if="meta.type=='num'">{{data[meta.prop] | numFormat(null,1)}}</span>
      <!--金额类型-->
      <span v-else-if="meta.type=='money'">{{data[meta.prop] | numFormat(2,1)}}</span>
      <!--时间类型-->
      <span v-else-if="meta.type=='date'">{{data[meta.prop] | dateFormat('yyyy-MM-dd hh:mm:ss')}}</span>
      <!--标签类型-->
      <span v-else-if="meta.type=='tag'">
          <el-tag>{{translate(meta,data).name}}</el-tag>
        </span>

      <!--链接类型-->
      <span v-else-if="meta.type=='link'">
          <a class="uk-link uk-text-break"
             title="点击浏览"
             target="_blank"
             :href="data[meta.prop] ">
              {{data[meta.prop]}}
          </a>
        </span>

      <!--文件类型-->
      <!--当为可展示文件时，自动渲染-->
      <span v-else-if="meta.type=='file'">
         <a class="uk-link uk-text-break"
        title="点击下载"
        :href="data[meta.prop]" :download="data[meta.prop]">
           <span v-if="_.isFunction(meta.getName)">{{meta.getName(data)}}</span>
           <span v-else> {{data[meta.descProp] || '点击下载'}}</span>
        </a>
        <!--第三方 在线预览-->
          <!--<el-popover-->
            <!--placement="top"-->
            <!--width="500"-->
            <!--trigger="hover"-->
            <!--:disabled="!_.contains(['.pptx','.ppt','doc','docx','xlsx','xls'],(data[meta.prop] || '').substring(0,(data[meta.prop] || '').indexOf('?')).substr((data[meta.prop] || '').lastIndexOf('.')))"-->
          <!--&gt;-->
            <!--<div  class="uk-text-center" >-->
        <!--<iframe style="max-height: 500px;width: 100%;" :src="'http://view.officeapps.live.com/op/view.aspx?src='+encodeURIComponent(data[meta.prop])" frameborder="0"></iframe>-->
        <!--</div>-->
        <!--<div slot="reference">-->
        <!--<a class="uk-link"-->
        <!--title="点击下载"-->
        <!--:href="data[meta.prop]" :download="data[meta.prop]">-->
        <!--{{data[meta.descProp] || '点击下载'}}-->
        <!--</a>-->
            <!--</div>-->
            <!--</el-popover>-->
        </span>

      <!--圆形进度-->
      <div v-else-if="meta.type=='progress-circle'" >

        <div class="uk-flex uk-flex-nowrap" >
          <div style="padding-top: 5px;">
            <el-progress :percentage="data[meta.prop]" :stroke-width="2" :width="36" type="circle" sytle="" />
          </div>
          <div class="ellipsis " :title="data[meta.descProp]" style="padding-left: 5px;" :style="{'padding-top':meta.weightProp?0:'10px'}">
            {{data[meta.descProp]}}
          </div>
          <span class="uk-text-muted " v-if="meta.weightProp" style="font-size: 2px;position: absolute;top:20px;left:60px;">权重{{data[meta.weightProp]}}%</span>
        </div>

      </div>

      <!--进度-->
      <span v-else-if="meta.type=='progress'">
           <el-progress :percentage="data[meta.prop]" />
            {{data[meta.descProp]}}
      </span>

      <!--二维码-->
      <div v-else-if="meta.type=='qr'">
        <el-popover
          placement="left"
          width="500"
          trigger="hover"
        >
          <div class="uk-text-center ">
            <qrImg :qrStr="data[meta.prop]" :description="data[meta.descProp]" :ifDownloadShow="true"></qrImg>
          </div>
          <qrImg slot="reference" style="height: 40px;" :qrStr="data[meta.prop]" :description="data[meta.descProp]"></qrImg>
        </el-popover>
      </div>

      <!--图片类型-->
      <span v-else-if="meta.type=='img'">
           <el-popover
             v-if="data[meta.prop]"
             placement="top"
             width="750"
             trigger="hover"
           >
              <div class="uk-text-center" style="max-height: 500px;overflow: auto;">
                <img style="" :src="data[meta.prop]"/>
              </div>
              <img slot="reference" style="height: 50px;" :src="data[meta.prop]"/>
            </el-popover>
        </span>


      <span v-else>{{getObjValue(data,meta.prop)}}</span>

    </div>
    <div style="clear: both"></div>

  </li>
</template>
<script>
  import _ from "underscore"
  import QrImg from "@/components/QrImg"

  export default {
    props: {
      /*meta: e.g{
     详见 settings.interfaceMetaMap
    */
      meta: {
        type: Object,
        default:()=>{return {}}
      },
      //属性名和 meta 定义一致的 数据对象
      data: {
        type: Object,
        default:()=>{return {}}

      },

      // 可不传meta.icon，直接传icon内容 显示
      icon:{default:""},
      //可不传meta.label ，直接传label内容显示
      label:{default:""},
      //可不传data,meta.prop,直接传value内容显示
      value:{default:""},

      // 是否不显示label
      noLabel: {},
      labelWidth: {
        type: Number,
        default: 120
      },


    },
    methods: {
      // 字典翻译
      //meta,标签id,
      //xData
      //return {id:标签id,name:标签名称}
      translate(meta, xData) {
        return _.findWhere(meta.dics(xData[meta.prop]), {id: xData[meta.prop]}) || {}
      },

      //预览文件div显示
      onFilePreviewDivShow(xFileUrl){
        this.$api.getFile(xFileUrl).then((xRes)=>{
          console.log("onFilePreviewDivShow",xRes);

        })
          .catch((e)=>{
            console.log("onFilePreviewDivShowErr",e)
          })
      },
    },
    components: {
      QrImg
    }
  }
</script>
