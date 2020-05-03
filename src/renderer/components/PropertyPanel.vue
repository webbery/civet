<template>
  <div class="property">
    <div class="preview">
      <!-- <div class="image" v-bind:style="{backgroundImage:`url(${picture.realpath})`}"></div> -->
      <!-- <el-image :src="picture.realpath" lazy></el-image> -->
    </div>
    <div class="tags">
      <el-tag
        :key="tag"
        v-for="tag in dynamicTags"
        size="mini" closable
        :disable-transitions="false"
        @close="handleClose(tag)"
      >{{tag}}</el-tag>
      <el-input
        class="input-new-tag"
        v-if="inputVisible"
        v-model="inputValue"
        ref="saveTagInput"
        size="small"
        @keyup.enter.native="handleInputConfirm"
        @blur="handleInputConfirm"
      ></el-input>
      <el-button v-else class="button-new-tag" size="mini" @click="showInput">添加标签</el-button>
    </div>
    <div class="title">基本信息</div>
    <el-row class="desc">
      <el-col :span="12">
        <div class="name">路径: </div>
        <div class="name">尺寸: </div>
        <div class="name">文件大小: </div>
        <div class="name">类型: </div>
        <div class="name">添加日期: </div>
      </el-col>
      <el-col :span="12">
        <div class="value">{{picture.path}}</div>
        <div class="value">{{picture.width}} X {{picture.height}}</div>
        <div class="value">{{picture.size}}</div>
        <div class="value">{{picture.type}}</div>
        <div class="value">{{picture.datetime}}</div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import bus from './utils/Bus'
import localStorage from './utils/LocalStorage'

export default {
  name: 'property-panel',
  data() {
    return {
      picture: { path: '?', width: 0, height: 0, size: 0 },
      dynamicTags: [],
      inputVisible: false,
      inputValue: ''
    }
  },
  mounted() {
    bus.on(bus.EVENT_SELECT_IMAGE, this.displayProperty)
  },
  methods: {
    async displayProperty(imageID) {
      let getSize = (sz) => {
        let v = sz / 1024
        let unit = 'Kb'
        if (v / 1024 > 1) {
          unit = 'Mb'
          v = v / 1024
        }
        return parseInt(v) + unit
      }
      let image = await localStorage.getImageInfo(imageID)
      console.info(image)
      image.size = getSize(image.size)
      this.picture = image
    },
    handleClose(tag) {
      this.dynamicTags.splice(this.dynamicTags.indexOf(tag), 1)
    },
    showInput() {
      this.inputVisible = true
      this.$nextTick(_ => {
        this.$refs.saveTagInput.$refs.input.focus()
      })
    },
    handleInputConfirm() {
      let inputValue = this.inputValue
      if (inputValue) {
        this.dynamicTags.push(inputValue)
      }
      this.inputVisible = false
      this.inputValue = ''
    }
  }
}
</script>

<style scoped>
.property{
  margin: 5px 5px 2px 5px;
}
.preview{
  background-color: grey;
  border-radius: 5px;
  width: 100%;
  height: 200px;
}
.preview .image{
  /* width: 100%; */
  background-size: cover;
  padding-top: 100%;
  background-repeat: no-repeat;
  background-size: 100% 100%;
}
.title {
  font-weight: bold;
  font-family: "lucida grande", "lucida sans unicode", lucida, helvetica,
    "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif;
  font-size: 14px;
}
.desc {
  font-family: "lucida grande", "lucida sans unicode", lucida, helvetica,
    "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif;
  font-size: 13px;
}
.el-tag + .el-tag {
  margin-left: 10px;
}
.button-new-tag {
  margin-left: 10px;
  height: 32px;
  line-height: 30px;
  padding-top: 0;
  padding-bottom: 0;
}
.input-new-tag {
  width: 90px;
  margin-left: 10px;
  vertical-align: bottom;
}
.tags{
  background-color: gray; 
  border-style: solid;
  border-width: 1px;
  border-radius:5px;
}
.name{
  text-align: left;
}
.value{
  text-overflow:ellipsis;
  white-space:nowrap;
  overflow: hidden;
  display: block;
  text-align: right;
}
</style>