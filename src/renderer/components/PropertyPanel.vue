<template>
  <div class="property">
      <el-card :body-style="{ padding: '0px' }">
        <img :src="picture.thumbnail?('data:image/jpg;base64,'+picture.thumbnail):picture.path" class="preview" />
        <div>
          <span v-for="color of picture.colors" :key="color"><span class="main-color" :style="{'background-color': color}" ></span></span>
        </div>
        <div style="padding: 4px;" class="image-name">
          <span >{{picture.label}}</span>
        </div>
      </el-card>
      <!-- <div class="image" v-bind:style="{backgroundImage:`url(${picture.realpath})`}"></div> -->
    <fieldset>
      <legend class="title">标签</legend>
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
    </fieldset>
    <fieldset>
      <legend class="title">分类</legend>
      <div>
        <IconTag v-for="clz in imageClasses" :key="clz" icon="el-icon-folder">{{clz.name}}</IconTag>
      <el-popover
        placement="left"
        width="160"
        v-model="visible">
        <div>
          <div v-for="(clazz,idx) in classes" :key="clazz">
            <el-checkbox v-model="checkValue[idx]" :label="clazz.name" border size="mini" @change="onCategoryChange"></el-checkbox>
          </div>
        </div>
        <el-button slot="reference" size="mini">+</el-button>
      </el-popover>
      </div>
    </fieldset>
    <fieldset>
      <legend class="title">基本信息</legend>
    <el-row class="desc">
      <el-col :span="12">
        <div class="name">路径: </div>
        <div class="name">尺寸: </div>
        <div class="name">文件大小: </div>
        <div class="name">类型: </div>
        <div class="name">添加日期: </div>
      </el-col>
      <el-col :span="12">
        <div ><a href="javascript:void(0);" @click="openFolder()" class="value">{{picture.path}}</a></div>
        <div class="value">{{picture.width}} X {{picture.height}}</div>
        <div class="value">{{picture.size}}</div>
        <div class="value">{{picture.type}}</div>
        <div class="value">{{picture.datetime}}</div>
      </el-col>
    </el-row>
    </fieldset>
  </div>
</template>

<script>
import bus from './utils/Bus'
import Service from './utils/Service'
import IconTag from '@/components/IconTag'
import JString from '@/../public/String'

export default {
  name: 'property-panel',
  data() {
    return {
      picture: { id: null, path: '', width: 0, height: 0, size: 0 },
      dynamicTags: [],
      inputVisible: false,
      inputValue: '',
      // classes: [{name: '测试', icon: 'el-icon-suitcase'}],
      checkValue: [],
      imageClasses: []
    }
  },
  components: {
    IconTag
  },
  computed: {
    classes() {
      return this.$store.getters.classesName
    }
  },
  mounted() {
    bus.on(bus.EVENT_SELECT_IMAGE, this.displayProperty)
  },
  methods: {
    async displayProperty(imageInfo) {
      let getSize = (sz) => {
        let v = sz / 1024
        let unit = 'Kb'
        if (v / 1024 > 1) {
          unit = 'Mb'
          v = v / 1024
        }
        return parseInt(v) + unit
      }
      imageInfo.size = getSize(imageInfo.size)
      if (imageInfo.colors) {
        let colors = []
        for (let color of imageInfo.colors) {
          colors.push('#' + JString.formatColor16(color[0]) + JString.formatColor16(color[1]) + JString.formatColor16(color[2]))
        }
        imageInfo.colors = colors
      }
      this.picture = imageInfo
      this.dynamicTags = imageInfo.tag
    },
    handleClose(tag) {
      this.dynamicTags.splice(this.dynamicTags.indexOf(tag), 1)
      this.$ipcRenderer.send(Service.REMOVE_TAG, {tagName: tag, imageID: this.picture.id})
      this.$store.dispatch('updateImageProperty', this.picture.id, 'tag', this.dynamicTags)
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
        this.$ipcRenderer.send(Service.ADD_TAG, {imageID: this.picture.id, tagName: inputValue})
        this.$store.dispatch('updateImageProperty', this.picture.id, 'tag', this.dynamicTags)
      }
      this.inputVisible = false
      this.inputValue = ''
    },
    openFolder() {
      const exec = require('child_process').exec
      const path = require('path')
      const os = require('os')
      if (os.platform() === 'win32') {
        // console.info('explorer /select,' + path.resolve(this.picture.path))
        exec('explorer /select, ' + path.resolve(this.picture.path))
      } else {
        console.info('not support os')
      }
    },
    onCategoryChange(val, idx) {
      console.info(val, idx)
      console.info(this.checkValue)
      // 更新本地缓存分类
      // 更新数据库分类
    }
  }
}
</script>

<style scoped>
.property{
  margin: 5px 5px 2px 5px;
}
img{
  width: 100%;
  height: 250px;
}
.preview{
  object-fit: scale-down;
}
.main-color{
  width: 20px;
  height: 35px;
  margin: 1px 3px 1px 3px;
  border-radius: 8px;
  display: inline-block;
}
.image-name{
  text-align: center;
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
.name{
  text-align: left;
}
.value{
  max-width: 100px;
  text-overflow:ellipsis;
  white-space:nowrap;
  overflow: hidden;
  display: block;
  text-align: right;
}
fieldset {
  border-radius: 5px;
  border: 1px solid black;
  max-width: 100%;
}
</style>
