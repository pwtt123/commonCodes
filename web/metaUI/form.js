<!--按照 settings中 meta 规则 渲染的表单 -->
<!--
methods:
  refresh() 刷新此组件
  initData() 某些组件（远程下拉框）初始化数据，meta改变会自动执行，data改变需手动执行
  setFormData(xFullFormData,xExtendFormData) 设置表单中的数据为 （深拷贝后的）数据，xFullFormData ，全部替换为此对象数据， xExtendFormData 只替换此对象有的属性
  getFormData(),return （深拷贝后的） 当前的 formData
  isFromValidated(xCallback(isValidate,illegalItems))，检查整个表单是否合法  return Promise   详见  http://element-cn.eleme.io/#/zh-CN/component/form
  clearFormValidate(xCallback(props)), 移除表单的检验结果，详见  http://element-cn.eleme.io/#/zh-CN/component/form
events:
  formItemChange(xMeta,xData) 单个表单值改变，返回其meta以及改变后的data
  formItemValidate(xProp, xIfPassed, err),单个表单验证结果， 详见  http://element-cn.eleme.io/#/zh-CN/component/form

prop.sync:
 ifEdited 判断当前表单数据是否被改变（实时检测） ifOpenEditCheck  开启时才会计算，关闭不会计算

-->

<template>
  <div><span v-if="ifOpenEditCheck" v-show="false">{{checkIfEdited}}</span>
    <el-form :model="formData"
             label-position="right"
             :label-width="labelWidth+'px'"
             :rules="rules"
             @validate="onFormValidate"
             ref="metaFrom"
             status-icon
             class="uk-grid uk-grid-small "
             uk-grid
             :class="formclass ? formclass : 'uk-child-width-1-'+colNum"
    >


      <el-form-item
        v-for="(xMeta,xKey,xIndex) in metaMap" :key="xIndex"
        v-if="!xMeta.isHidden"
        :prop="xMeta.prop"
        class="uk-margin-bottom"
        :style="xMeta.style"
        :class="xMeta.class ? xMeta.class :
      {['uk-width-2-'+colNum]:xMeta.type=='textarea','uk-disabled':xMeta.isDisabled}"
      >
      <span slot="label"
            :class="{'uk-disabled':xMeta.isDisabled,[xMeta.labelclass]:xMeta.labelclass}">{{xMeta.label}}</span>
        <!--标签类型-->
        <div v-if="xMeta.type=='tag'">
          <el-select @change="onFormItemChange(xMeta,formData[xMeta.prop])"
                     clearable
                     v-model="formData[xMeta.prop]"
                     style="width: 100%;"
                     :placeholder="xMeta.placeholder">
            <el-option v-for="(xTag,xIndex) in xMeta.dics()" :label="xTag.name" :value="xTag.id"
                       :key="xIndex"></el-option>
          </el-select>
        </div>

        <!--选择框类型-->
        <!--xMeta.options:[{id:"xx",name:'xx'},...]-->
        <div v-else-if="xMeta.type=='select'">
          <el-select v-model="formData[xMeta.prop]"
                     clearable
                     :placeholder="xMeta.placeholder"
                     no-data-text="未检索到数据"
                     :loading="xMeta._isLoading"
                     @change="onFormItemChange(xMeta,formData[xMeta.prop])"
                     style="width: 100%;"
          >
            <el-option v-for="(xOptions,xIndex) in xMeta.options" :key="xIndex" :label="xOptions.name"
                       :value="xOptions.id"></el-option>
          </el-select>
        </div>


        <!--月份-->
        <div v-else-if="xMeta.type=='month'">
          <el-date-picker
            v-model="formData[xMeta.prop]"
            type="month"
            :picker-options="xMeta.pickerOptions"
            value-format="yyyy-MM"
            :placeholder="xMeta.placeholder"
            @change="onFormItemChange(xMeta,formData[xMeta.prop])"
            style="width: 100%;"
          >
          </el-date-picker>
        </div>


        <!--时间类型-->
        <div v-else-if="xMeta.type=='date'">
          <el-date-picker type="datetime"
                          :placeholder="xMeta.placeholder"
                          v-model="formData[xMeta.prop]"
                          :default-value="new Date().format('yyyy-MM-dd')"
                          default-time="10:00:00"
                          :value-format="$settings.interfaceDateFormat"
                          @change="onFormItemChange(xMeta,formData[xMeta.prop])"
                          style="width: 100%;"
          ></el-date-picker>
        </div>


        <!--进度条-->
        <el-slider v-else-if="xMeta.type=='progress'|| xMeta.type=='progress-circle'" v-model="formData[xMeta.prop]"
                   :step="1" style="" @change="onFormItemChange(xMeta,formData[xMeta.prop])"/>


        <!--远程获取数据下拉框(单选)-->
        <!--当 setFormData 时，若候选项中不存在对应的value,会自动增加的候选项，label 为 formData[meta.descProp],value 为 formData[meta.prop]-->
        <!--当 初始化，点击清空按钮，或者输入值为空时 执行 meta.selectInitMethod 方法-->
        <!--当 输入值存在，执行meta.selectRemoteMethod方法-->
        <div v-else-if="xMeta.type=='remoteSelect'">
          <el-select
            v-model="formData[xMeta.prop]"
            filterable
            remote
            clearable
            :placeholder="xMeta.placeholder"
            :remote-method="selectRemoteMethod(xMeta)"
            no-data-text="未检索到数据"
            :loading="xMeta._isLoading"
            @clear="selectInitMethod(xMeta)"
            @change="onFormItemChange(xMeta,formData[xMeta.prop])"
            style="width: 100%;"
          >
            <el-option v-for="(xOption,xIndex) in xMeta._options"
                       :label="xOption.label"
                       :value="xOption.value"
                       :key="xIndex">
            </el-option>
          </el-select>
        </div>


        <!--数字类型-->
        <el-input v-else-if="_.contains(['num','money'],xMeta.type)"
                  type="number"
                  @change="onFormItemChange(xMeta,formData[xMeta.prop])"
                  v-model.number="formData[xMeta.prop]"
                  :placeholder="xMeta.placeholder"></el-input>


        <!--文本框类型 博客标题-->
        <el-input v-else-if="xMeta.type=='blogTitle'"
                  @change="onFormItemChange(xMeta,formData[xMeta.prop])"
                  v-model="formData[xMeta.prop]"
                  :placeholder="xMeta.placeholder"
        ></el-input>

        <!--博客主题分类选择-->
        <div v-else-if="xMeta.type=='blogCategory'">
          <el-select
            v-model="formData[xMeta.prop]"
            :placeholder="xMeta.placeholder"
            no-data-text="未找到可选主题"
            :loading="xMeta._isLoading"
            @change="onFormItemChange(xMeta,formData[xMeta.prop])"
            @focus.once="getBlogCategorys(xMeta)"
            style="width: 100%;"
          >
            <el-option v-for="(xCategory,xIndex) in xMeta._categorys"
                       :label="(xCategory['name'] || '')"
                       :value="xCategory['value']"
                       :key="xIndex">
            </el-option>
          </el-select>
        </div>

        <!--博客标签选择-->
        <div v-else-if="xMeta.type=='blogTags'">
          <el-select
            ref="selHotTags"
            v-model="formData[xMeta.prop]"
            multiple
            filterable
            allow-create
            default-first-option
            no-data-text="未找到可用标签"
            :placeholder="xMeta.placeholder"
            @change="onFormItemChange(xMeta,formData[xMeta.prop])"
            style="width: 100%;"
          >
            <el-option-group :label="'热门标签'">
              <el-option v-for="(xTag,xIndex) in xMeta._tags"
                         :label="xTag.name || ''"
                         :value="xTag.name|| ''"
                         :key="xIndex">
              </el-option>
            </el-option-group>
          </el-select>
        </div>

        <!--富文本类型-->
        <EditorMCE v-else-if="xMeta.type=='richeditor'"
                   v-model="formData[xMeta.prop]"
                   :id="xMeta.prop"
                   :other_options="xMeta.initTinymce"
        ></EditorMCE>

        <!--开关类型-->
        <el-switch v-else-if="xMeta.type=='switch'"
                   v-model="formData[xMeta.prop]"
                   @change="onFormItemChange(xMeta,formData[xMeta.prop])"
        ></el-switch>


        <!--文本框类型-->
        <el-input v-else :type="{'textarea':'textarea','pwd':'password'}[xMeta.type] || 'text'"
                  clearable
                  @change="onFormItemChange(xMeta,formData[xMeta.prop])"
                  v-model="formData[xMeta.prop]"
                  :placeholder="xMeta.placeholder"></el-input>
      </el-form-item>

    </el-form>
  </div>
</template>
<script>
  import _ from "underscore"
  import EditorMCE from '@/components/EditorMCE'

  export default {
    props: {
      /*meta: e.g{
        详见 settings.interfaceMetaMap
    */
      metaMap: {
        require: true,
        type: Object
      },

      //自定义表单class ，如果有的话自动分列失效，需给每个item指定class
      formclass: {},
      labelWidth: {
        type: Number,
        default: 80
      },

      //列表显示的列数
      colNum: {
        type: Number,
        default: 1
      },

      //  通过 .sync 绑定
      //  是否数据被编辑过（实时计算）
      // 需开启 ifOpenEditCheck
      ifEdited: {default: false},

      // 是否开启编辑检查
      // 开启后 实时监测 setFormData之后的数据 是否被编辑, 但耗费资源
      // 通过 ifEdited.sync 绑定
      ifOpenEditCheck: {
        default: false
      }

    },
    mounted() {
      //初始化数据
      this.initData();
    },
    data() {
      let zRules = this.getRules();
      return {
        userKeyword: "",
        users: [],

        formData: {},

        //用于对比数据是否更改
        sourceFormData: {},

        // 不同类型的字段验证规则
        rules: zRules,

      }
    },

    computed: {
      roles() {
        return this.$store.state.user.roles;
      },
      groups() {
        return this.$store.state.user.groups;
      },
      //检查是否修改过数据
      checkIfEdited() {
        let zIfEdited = !_.isEqual(this.sourceFormData, this.formData);
        this.$emit("update:ifEdited", zIfEdited);
        return zIfEdited
      },
    },

    methods: {
      refresh() {
        this.$forceUpdate();
      },
      // 设置当前的表单数据
      //xFullFormData，若不为空，则所有数据清空，并设置为 xFullFormData
      //xExtendFormData，若不为空，则替换 xExtendFormData 中存在的属性字段，其余字段值不变，后于 xFullFormData 生效
      setFormData(xFullFormData, xExtendFormData) {
        if (xFullFormData) this.formData = JSON.parse(JSON.stringify(xFullFormData || {}));
        if (xExtendFormData) {
          _.each(JSON.parse(JSON.stringify(xExtendFormData || {})), (xData, xProp) => {
            this.$set(this.formData, xProp, xData)
          });
          // console.log("xExtendFormData", xExtendFormData, this.formData)
        }
        this.sourceFormData = _.clone(this.formData);

        // 远程下拉框，setForm时，当formData 中的数据不再 候选项中时，增加候选项的值
        _.each(this.metaMap, (xMeta) => {
          if (xMeta.type == 'remoteSelect' && this.formData[xMeta.prop]) {
            console.log("xMetaaaa",xMeta.prop)
            if(!_.findWhere(xMeta._options, {value:this.formData[xMeta.prop]})){
              let zOld=xMeta._options || [];
              zOld.unshift({
                  label: this.getObjValue(this.formData, xMeta.descProp) || this.formData[xMeta.prop],
                  value: this.formData[xMeta.prop]
                });

              this.$set(xMeta, "_options",zOld)

            }
          }
        });

        this.$forceUpdate();
      },
      // 获取当前的表单数据
      getFormData() {
        return JSON.parse(JSON.stringify(this.formData));
      },
      numValidator: _.debounce((rule, value, callback) => {
        if (isNaN(value)) return callback(new Error('输入值必须为数字！'));
        callback();
      }, 300),

      //初始化数据
      initData() {
        _.each(this.metaMap, (xMeta) => {
          if (xMeta.type == 'blogTags') this.initBlogTags(xMeta);
          if (xMeta.type == 'remoteSelect') this.selectInitMethod(xMeta);
        })
      },


      //初始化标签选择列表
      initBlogTags(xMeta) {
        let zReq = {};
        let zThis = this;
        if (xMeta._tags !== undefined) return;

        this.$set(xMeta, "_isLoading", true);
        // 查询文章标签列表
        this.$api.blog.getBlogHotTags(zReq).then((res) => {
          console.log("getBlogHotTags", res);
          this.$set(xMeta, "_tags", (res.result || {}).data || []);
          this.$set(xMeta, "_isLoading", false);
        })
          .catch((e) => {
            console.log("getBlogHotTagsErr", e);
            this.$set(xMeta, "_isLoading", false);
          })
      },


      //远程下拉菜单初始化方法
      // 当tag 为remoteSelect 时，可以填此方法作为下拉菜单的的默认方法，当初次渲染，或者remoteMethod 返回的值不为数组时触发，
      // 当返回数据时，若当前 表单 中有值，则不会覆盖候选项，
      // 也可以 手动调用 $refs.metaForm.initData()触发 ，参数同remoteMethod,
      selectInitMethod(xMeta) {
        if (_.isFunction(xMeta.selectInitMethod)) {
          this.$set(xMeta, "_isLoading", true);
          xMeta.selectInitMethod(xMeta, (xOptions) => {
            this.$set(xMeta, "_isLoading", false);
            if (this.formData[xMeta.prop]) return;
            this.$set(xMeta, "_options", (xOptions || []).slice(0, 50));
          })
        }
      },

      // 远程下拉框的远程方法 当tag 为remoteSelect 时，必须有，用于远程获取标签数据，
      //  xMeta:触发此方法对应的meta,xValue，触发此方法时，输入的值，
      //  xCallback( [{label:xx,value:xxx},...] ),回调获取的下拉内容，value为实际的值，label为显示的值,
      // 当为options不为数组时，自动触发initMethods方法（如果存在的话）
      selectRemoteMethod(xMeta) {
        return (xValue) => {
          if (!_.isFunction(xMeta.selectRemoteMethod)) throw Error(" meta 中 tag 为'remoteSelect'时，必须存在 selectRemoteMethod 方法");
          this.$set(xMeta, "_isLoading", true);
          xMeta.selectRemoteMethod(xMeta, xValue, (xOptions) => {
            this.$set(xMeta, "_isLoading", false);
            if (_.isArray(xOptions)) {
              this.$set(xMeta, "_options", xOptions.slice(0, 50));
            } else {
              this.selectInitMethod(xMeta);
            }
          })
        }
      },


      getBlogCategorys(xMeta) {
        let zReq = {};

        if (xMeta._categorys !== undefined) return;

        this.$set(xMeta, "_isLoading", true);
        // 查询文章分类列表
        this.$api.blog.getBlogCategorys(zReq).then((res) => {
          console.log("getBlogCategorys", res);
          this.$set(xMeta, "_isLoading", false);
          this.$set(xMeta, "_categorys", (res.result || {}).data || []);
        })
          .catch((e) => {
            console.log("getBlogCategorysErr", e);
            this.$set(xMeta, "_isLoading", false);
          })
      },

      onFormValidate(xProp, xIfPassed, err) {
        // if(err)console.log("onFormValidate",err);
        this.$emit("formItemValidate", xProp, xIfPassed, err);
      },
      onFormItemChange(xMeta, xData) {
        // console.log("onFormItemChange",xMeta,xData);
        this.$emit("formItemChange", xMeta, xData)
      },
      isFormValidated(xCallback) {
        return this.$refs.metaFrom.validate(xCallback)
      },
      clearFormValidate(xCallback) {
        return this.$refs.metaFrom.clearValidate(xCallback)
      },
      // 设置 rules
      getRules() {
        let zRules = {};

        _.each(this.metaMap, (xMeta, xKey) => {

          zRules[xMeta.prop] = _.clone(xMeta.rules) || [];
          // 当meta 必须，且未隐藏时，增加 required 验证
          if (!xMeta.noRequired) {
            zRules[xMeta.prop].push({required: true, message: `${xMeta.label}不能为空`, trigger: 'change'})
          }
          //数字类型验证
          if (_.contains(['num', 'money'], xMeta.type)) {
            zRules[xMeta.prop].push({validator: this.numValidator, trigger: "change"});
          }
          //... 待增加

        });
        // console.log("zRules",zRules);
        // this.$set(this,"rules",zRules);
        return zRules;
      },
    }
    ,
    watch: {
      metaMap(xNew, xOld) {
        // meta变更时，初始化数据
        this.initData();
      },
    },
    components: {
      EditorMCE,
    }
    ,
  }
</script>
