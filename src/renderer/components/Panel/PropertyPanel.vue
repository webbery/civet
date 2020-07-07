<template>
  <div class="property">
      <el-card :body-style="{ padding: '0px' }">
        <JImage :src="imagepath" :interact="false"></JImage>
        <div>
          <span v-for="color of picture.desccolors" :key="color"><span class="main-color" :style="{'background-color': color}" ></span></span>
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
        <IconTag v-for="clz in imageClasses" :key="clz" icon="el-icon-folder">{{clz}}</IconTag>
        <el-popover
          placement="left"
          width="160"
          v-model="visible">
          <div>
            <div v-for="(clazz,idx) in candidateClasses" :key="clazz">
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
        <div ><a href="javascript:void(0);" @click="openFolder()" class="value">{{imagepath}}</a></div>
        <div class="value">{{picture.width}} X {{picture.height}}</div>
        <div class="value">{{picture.descsize}}</div>
        <div class="value">{{picture.type}}</div>
        <div class="value">{{picture.datetime}}</div>
      </el-col>
    </el-row>
    </fieldset>
  </div>
</template>

<script>
import bus from '../utils/Bus'
import Service from '../utils/Service'
import IconTag from '@/components/IconTag'
import JString from '@/../public/String'
import JImage from '../JImage'
import ImgTool from '../utils/ImgTool'
import log from '@/../public/Logger'

export default {
  name: 'property-panel',
  data() {
    return {
      picture: { id: null, width: 0, height: 0, size: 0, colors: [] },
      imagepath: '',
      dynamicTags: [],
      inputVisible: false,
      inputValue: '',
      checkValue: [],
      classes: []
    }
  },
  components: {
    IconTag, JImage
  },
  computed: {
    candidateClasses() {
      return this.$store.getters.classesName
    },
    imageClasses() {
      return this.classes
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
        return v.toFixed(1) + unit
      }
      let image = this.$store.getters.image(imageID)
      this.classes.length = 0
      for (let c of image.category) {
        this.classes.push(c)
      }
      log.info('PropertyPanel', image)
      this.picture.descsize = getSize(image.size)
      let colors = []
      if (image.colors) {
        for (let color of image.colors) {
          colors.push('#' + JString.formatColor16(color[0]) + JString.formatColor16(color[1]) + JString.formatColor16(color[2]))
        }
        this.picture.colors = colors
      }
      const clazzName = this.$store.getters.classesName
      // console.info('clear', clazzName)
      for (let idx in clazzName) {
        this.checkValue[idx] = false
      }
      if (image.category) {
        for (let idx in clazzName) {
          for (let n of image.category) {
            // console.info(n, image.category)
            if (n.name === clazzName[idx].name) {
              this.checkValue[idx] = true
              break
            }
          }
        }
      }
      // image.desccolors = colors
      this.picture.id = image.id
      this.imagepath = image.path
      this.picture.width = image.width
      this.picture.height = image.height
      this.picture.datetime = image.datetime
      this.picture.type = image.type
      this.picture.label = image.label
      this.dynamicTags = image.tag ? image.tag.slice(0) : []
    },
    handleClose(tag) {
      this.dynamicTags.splice(this.dynamicTags.indexOf(tag), 1)
      this.$ipcRenderer.send(Service.REMOVE_TAG, {tagName: tag, imageID: this.picture.id})
      this.$store.dispatch('updateImageProperty', {id: this.picture.id, key: 'tag', value: this.dynamicTags})
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
        this.$store.dispatch('updateImageProperty', {id: this.picture.id, key: 'tag', value: this.dynamicTags})
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
    async onCategoryChange(val) {
      const isCategoryExist = (arr, category) => {
        for (let item of arr) {
          if (item.name === category.name) return true
        }
        return false
      }
      // 更新本地缓存分类
      const img = this.$store.getters.image(this.picture.id)
      let selClasses = img.category ? img.category.slice(0) : []
      const originalClz = this.$store.getters.classesName
      for (let idx in this.checkValue) {
        if (this.checkValue.hasOwnProperty(idx)) {
          console.info(originalClz[idx])
          let parent = originalClz[idx].name
          if (originalClz[idx].parent !== '') parent = originalClz[idx].parent + '.' + parent
          if (val === true && this.checkValue[idx] === true) {
            this.$store.commit('addImage2Category', {id: this.picture.id, label: this.picture.label, parent: parent})
            if (!isCategoryExist(selClasses, originalClz[idx])) {
              // console.info('not exist', originalClz[idx])
              selClasses.push(originalClz[idx])
            }
          } else if (val === false && this.checkValue[idx] === false) {
            for (let pos in selClasses) {
              if (selClasses[pos].name === originalClz[idx].name && originalClz[idx].parent === selClasses[pos].parent) {
                if (selClasses.length > 1) selClasses.splice(pos, 1)
                else selClasses = []
                break
              }
            }
            this.$store.commit('removeImageFromCategory', {id: this.picture.id, name: this.picture.label, parent: parent})
          }
        }
      }
      this.$store.commit('updateImageProperty', {id: this.picture.id, key: 'category', value: selClasses})
      if (selClasses.length === 0) {
        bus.emit(bus.EVENT_UPDATE_UNCATEGORY_IMAGES, -1)
      } else if (img.category.length === 0) {
        bus.emit(bus.EVENT_UPDATE_UNCATEGORY_IMAGES, 1)
      }
      // console.info('get category', img.category)
      this.classes = img.category
      // console.info('get category', v)
      this.$ipcRenderer.send(Service.UPDATE_IMAGE_CATEGORY, {imageID: this.picture.id, category: img.category})
    },
    getSrc(image) {
      console.info('++++++++', ImgTool.getSrc(image))
      return ImgTool.getSrc(image)
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
/* .preview{
  object-fit: scale-down;
} */
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
