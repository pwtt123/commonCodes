<!--多个节点的滑块-->
<!--二维码图片-->
<template>
  <div class="" style="position: relative;height: 10px;width: 100%;">
    <!--array4Rander:{{array4Rander}}-->
    <input v-for="(xRange,xIndex) in array4Rander" class="uk-range" type="range" v-model.number="xRange.value" :min="xRange.min" :max="xRange.max" :step="step"
           style="position: absolute;"
           :style="{width:(xRange.max-xRange.min)+'%',left:xRange.left+'%'}"
            @change="onRangeChange(xRange)"
    >

  </div>
</template>
<script>
import _ from "underscore"
  export default {
    props:{
      //大于等于2个数字元素的数组，滑块有 value.length-1 个节点,把滑块分割成 value 数组对应数字的线段
      //当 数组之和 大于 max 时，数组末尾几项的数字会逐项减少,直到总和为 max，
      //当 数组之和 小于 max 时，数组末尾的数字会增加直到总和为 max，
      // 使用 :value.sync　绑定此属性
      value:{type:Array,default:()=>[]},

      //数组中每个数的最小值
      min:{type:Number,default:0},
      //数组中每个数的最大值
      max:{type:Number, default:100},
      // 滑动间隔
      step:{type:Number, default:1},
    },
    computed:{
      array4Rander(){
        let zRander=[];
        let zValue=_.clone(this.value);
        if(zValue.length<1)return [];
      /*
      l,t,r
      min=0
      max=l+r
      value=l
      left=ll+lll+llll...
      */
        //上一个
        let zLast=0;
        //上上个之和
        let zLLTotal=0;
        //当前之和
        let zTotal=0;
        let ifValueChange=false;
      _.each(zValue,(num,index)=>{
        num=Number(num);
        if(num<this.min){
          zValue[index]=num=this.min;
          ifValueChange=true;
        }
        if(zTotal+num>this.max){
          // console.log("overMax",zTotal,num,this.max);
          zValue[index]=this.max-zTotal;
          num=this.max-zTotal;
          // console.log("overMax2", index,zValue[index],num);
          ifValueChange=true;
        }
        zTotal+=num;
        if(index>0){
          zRander.push({
            index:index,
            min:0,
            max:num+zLast,
            value:zLast,
            left:zLLTotal
          });
        }
        zLLTotal+=zLast;
        zLast=num;
      });

      if(zTotal<this.max){
        zValue[zValue.length-1]+=this.max-zTotal;
        ifValueChange=true;
      }
      if(ifValueChange){
        this.$emit("update:value",zValue)
      }
        return zRander
      }
    },
    data(){
      return {
      }
    },
    methods:{
      onRangeChange(xRange){
        // console.log("onRangeChange",xRange);
        let zNewValue=_.clone(this.value);
        let zTotal=this.value[xRange.index]+this.value[xRange.index-1];
        zNewValue[xRange.index-1]=xRange.value;
        zNewValue[xRange.index]=zTotal-xRange.value;

        this.$emit("update:value",zNewValue)

      }
    }
  }
</script>
