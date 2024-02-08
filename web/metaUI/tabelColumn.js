<!--按照 settings中 meta 规则 渲染的表格列 -->
<!--events:
  treeExpanded(row,index,xCallback) 树形表单控制列事件 row,点击展开的行，index,点击展开的行在tableData中的下标 xCallback(xExpendedRows,xTableData)xExpendedRows：展开后新增的rows xTableData：table全数据（渲染原地址数组）
-->
<template>
    <el-table-column
                   :sortable="meta.sort"
                   :label="meta.label"
                   :min-width="meta.minWidth"
                   :prop="meta.prop"
                   :align="_.contains(['money','num'],meta.type)?'right':_.contains(['date','tag','img','qr'],meta.type)?'center':'left'"
  >
    <template slot-scope="scope"  class="">
      <!--树形结构类型 可展开列，每次点击展开按钮再此行下增加多行数据-->
      <div v-if="meta.type=='treeControl'">

        <div @click.stop="clickTreeExpandBtn(scope.row,scope.$index)" class="clickable">
          <!--缩进-->
          <span v-for="xIndex of (scope.row._level || 0)" :key="xIndex"><span v-if="6>xIndex">&nbsp;&nbsp;&nbsp;&nbsp;</span></span>
          <!--展开图标-->
          <span>
                <i v-if="scope.row._isChildLoading" class="el-icon-loading" aria-hidden="true"></i>
                <span v-else>
                    <i v-if="!scope.row._expanded" class="el-icon-caret-right " aria-hidden="true"></i>
                    <i v-if="scope.row._expanded" class="el-icon-caret-bottom " aria-hidden="true"></i>
                </span>

            </span>

          {{(scope.row._level || 0)+1}}级
        </div>
      </div>

      <div v-if="getObjValue(scope.row,meta.prop)!=null"
          >
        <!--数子类型-->
        <div v-if="meta.type=='num'" class="ellipsis" :title="scope.row[meta.prop]">{{scope.row[meta.prop] | numFormat(null,1)}}</div>
        <!--金额类型-->
        <div v-else-if="meta.type=='money'" class="ellipsis" :title="scope.row[meta.prop] | numFormat(2,1)">{{scope.row[meta.prop] | numFormat(2,1)}}</div>
        <!--时间类型-->
        <div v-else-if="meta.type=='date'" class="ellipsis" :title="scope.row[meta.prop] | dateFormat('yyyy-MM-dd hh:mm:ss')">{{scope.row[meta.prop] | dateFormat}}</div>
        <!--标签类型-->
        <div v-else-if="meta.type=='tag'" class="ellipsis" :title="translate(meta,scope.row).name">
         <el-tag v-if="translate(meta,scope.row).name">{{translate(meta,scope.row).name}}</el-tag>
        </div>



        <!--二维码-->
        <div v-else-if="meta.type=='qr'">
          <el-popover
            placement="left"
            width="500"
            trigger="hover"
          >
            <div class="uk-text-center ">
              <qrImg :qrStr="scope.row[meta.prop]" :description="scope.row[meta.descProp]" :ifDownloadShow="true"></qrImg>
            </div>
            <qrImg slot="reference" style="height: 40px;" :qrStr="scope.row[meta.prop]" :description="scope.row[meta.descProp]"></qrImg>
          </el-popover>
        </div>

        <!--进度条-->
        <div v-else-if="meta.type=='progress'">
          <el-progress :text-inside="false" :stroke-width="8" :percentage="scope.row[meta.prop]" />
        </div>

        <!--图片-->
        <div v-else-if="meta.type=='img'" >
          <el-popover
          placement="left"
          width="750"
          trigger="hover"
        >
          <div class="uk-text-center" style="max-height: 500px;overflow: auto;"><img style="" :src="scope.row[meta.prop]"/></div>
          <img slot="reference" style="height: 40px;" :src="scope.row[meta.prop]"/>
        </el-popover>
        </div>

        <div v-else  class="ellipsis" :title="getObjValue(scope.row,meta.prop)">{{getObjValue(scope.row,meta.prop)}}</div>
      </div>
    </template>
  </el-table-column>
</template>
<script>
  import _ from "underscore"
  import QrImg from "@/components/QrImg"
  export default{
    props:{
      /* e.g{
       详见 settings.interfaceMetaMap
      */
      meta:{
        required:true,
        type:Object
      },



    },
    mounted(){
    },
    methods:{
      // 字典翻译
      //xMeta,标签id,
      //xData
      //return {id:标签id,name:标签名称}
      translate(xMeta,xData){
       return  _.findWhere(xMeta.dics(xData[xMeta.prop]),{id:xData[xMeta.prop]}) || {}
      },

      clickTreeExpandBtn(row, index) {
        // console.log("clickTreeExpandBtn", row);
        if (!row) return;

        this.$set(row, "_expanded", !row["_expanded"]);
        // 已获取则不再获取
        if (row._ifChildGot || !row["_expanded"]) return;

        this.$set(row,'_isChildLoading',true) ;

        this.$emit("treeExpanded",row, index,(xExpandedRows,xTableData)=>{
          this.$set(row,'_isChildLoading',false) ;
          if(!_.isArray(xExpandedRows)) return;
          let zData = xExpandedRows || [];
          if (zData.length) {
            row._ifChildGot = 1;
          }
          // //强制刷新
          // if(!zData.length){
          //   xTableData.splice(index + 1, 0, {});
          //   xTableData.splice(index + 1, 1);
          // }
          _.each(zData, (xRec) => {
            xRec._level = (row._level || 0) + 1;
            xRec._parent = row;
            xTableData.splice(index + 1, 0, xRec);
          })
        });

      },

    },
    components:{
      QrImg
    }
  }
</script>
