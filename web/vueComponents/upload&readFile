<!--上传文件,并读取文件数据
methods:

events:
  close()
  uploaded(xFile) 文件上传完
  fileRead(xFileData) 文件读取完
-->
<template>
  <span>
    <input class="excel-upload-input" ref="excel-upload-input" type="file"  @change="handleUpload" :accept="(extMap[fileType] || '').join(',')">
    <el-button :loading="loading" style="margin-left:16px;" :plain="isBtnPlain" :size="btnSize" type="primary" @click="clickUploadedBtn">{{fileBtnValue}}</el-button>

    <!--<div class="drop" @drop="handleDrop" @dragover="handleDragover" @dragenter="handleDragover">-->
    <!--拖动文件到此 或者-->
    <!--</div>-->
  </span>
</template>

<script>
  import XLSX from 'xlsx'
  import decode from "@/utils/decode"
  import utils from "@/utils"
  import _ from "underscore"
  export default {
    props: {
      //上传前的方法
      //return true/false
      beforeUpload: Function,
      //上传及读取文件类型，csv/excel/text
      fileType:{default:'excel'},

      fileBtnValue:{default:"选择文件"},

      btnSize:{default:"medium"},

      isBtnPlain:{default:true},

      //读取的内容都转为字符串
      toString:{default:false},

    },
    data() {
      return {
        ifShow:false,
        loading: false,
        //读取后的数据
        readData: {},

        extMap:{
          csv:['.csv'],
          excel:['.xlsx','.xls'],
          text:['.txt']
        }

      }
    },
    methods: {
      open(){
        this.ifShow=true;
      },
      close(){
        this.ifShow=false;
      },
      onDialogClose(){
        this.$emit('close')
      },
      onDataRead(xData) {
        console.log("onDataRead",xData);
        this.readData=xData;
        this.$emit("fileRead",xData)
      },
      handleDrop(e) {
        e.stopPropagation()
        e.preventDefault()
        if (this.loading) return
        const files = e.dataTransfer.files;
        // console.log("aaa",e,files,files.length)
        if (files.length !== 1) {
          this.$message.error('只能上传一个文件！');
          return
        }
        const rawFile = files[0] // only use files[0]

        if (!this.checkFileType(rawFile)) {
          return false
        }
        this.onFileUploaded(rawFile)
        e.stopPropagation()
        e.preventDefault()
      },
      handleDragover(e) {
        e.stopPropagation()
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
      },
      clickUploadedBtn() {
        this.$refs["excel-upload-input"].click()
      },
      handleUpload(e) {
        const files = e.target.files;
        const rawFile = files[0] ;// only use files[0]
        if (!rawFile) return;
        if(!this.checkFileType(rawFile))return;
        this.$emit("uploaded",rawFile);
        this.onFileUploaded(rawFile)
      },
      onFileUploaded(rawFile) {
        this.$refs['excel-upload-input'].value = null // fix can't select the same excel
        this.handleFileData(rawFile)
      },
      handleFileData(rawFile) {
        this.loading = true;
          const reader = new FileReader();

          //csv类型读取
        if(this.fileType=='csv'){
          reader.onload = e => {

            // let data = e.target.result;

            let zBuffer = e.target.result;
            zBuffer=new Uint8Array(zBuffer);
            console.log("zBuffer",zBuffer)
            let data=decode.decodeBuffer(zBuffer);
            console.log("data",data)
            let parsedData=_.map(data.split("\n"),(xRowStr)=>{
              if(xRowStr) return xRowStr.split(",");
            });
            //去掉 undefined 项
            parsedData= _.compact(parsedData);
            // console.log("parsedData",parsedData);
            this.onDataRead(parsedData);
            this.loading = false;
          };
          reader.readAsArrayBuffer(rawFile)
          // reader.readAsText(rawFile)
        }

          //excel 类型读取
          if(this.fileType=="excel"){
            reader.onload = e => {
              const data = e.target.result
              const fixedData = this.fixData(data)
              const workbook = XLSX.read(btoa(fixedData), { type: 'base64' })
              const firstSheetName = workbook.SheetNames[0]
              const worksheet = workbook.Sheets[firstSheetName]
              let header = this.getHeaderRow(worksheet)
              let results = XLSX.utils.sheet_to_json(worksheet);
              results= utils.objList2ArrayList(header,results,{toString: this.toString});
              results.unshift(header);
              this.onDataRead(results);
              this.loading = false
            };
            reader.readAsArrayBuffer(rawFile)
          }

      },
      fixData(data) {
        let o = ''
        let l = 0
        const w = 10240
        for (; l < data.byteLength / w; ++l) o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w, l * w + w)))
        o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w)))
        return o
      },
      getHeaderRow(sheet) {
        const headers = []
        const range = XLSX.utils.decode_range(sheet['!ref'])
        let C
        const R = range.s.r
        /* start in the first row */
        for (C = range.s.c; C <= range.e.c; ++C) { /* walk every column in the range */
          const cell = sheet[XLSX.utils.encode_cell({ c: C, r: R })]
          /* find the cell in the first row */
          let hdr = 'UNKNOWN ' + C // <-- replace with your desired default
          if (cell && cell.t) hdr = XLSX.utils.format_cell(cell)
          headers.push(hdr)
        }
        return headers
      },
      checkFileType(file) {
        let zFileName=file.name || "";
        // console.log("www",file,zFileName);

        let zExt=zFileName.substr(zFileName.lastIndexOf('.')).toLowerCase();
        let zExts=this.extMap[this.fileType];
        // console.log("vvv",zExt,zExts,zExts.indexOf(zExt));
        let zIfLegal= (zExts.indexOf(zExt)>-1);
        if(!zIfLegal){
          this.$message.error(`文件类型必须为 ${zExts.join(',') }!`)
        }
        return zIfLegal;
      }
    },


  }
</script>

<style scoped>
  .excel-upload-input{
    display: none;
    z-index: -9999;
  }
  .drop{
    border: 2px dashed #bbb;
    width: 100%;
    height: 160px;
    line-height: 160px;
    margin: 0 auto;
    font-size: 24px;
    border-radius: 5px;
    text-align: center;
    color: #bbb;
    position: relative;
  }
</style>
