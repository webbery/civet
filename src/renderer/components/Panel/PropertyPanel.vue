<template>
  <div class="_cv_property" @click.stop="">
      <div :body-style="{ padding: '0px' }">
        <div style="padding: 4px;" class="image-name">
          <InputLabel v-on:changed="onNameChaged">{{filename}}</InputLabel>
        </div>
          <Preview :src="thumbnail"></Preview>
          <div class="color-container">
            <span v-if="colors.length!==0" ><span class="main-color" v-for="color of colors" :key="color" :style="{'background-color': color}" ></span></span>
            <span v-else icon="el-icon-loading"></span>
          </div>
        <!-- </div> -->
      </div>
    <fieldset>
      <legend class="_cv_title">标签</legend>
      <el-tag
        :key="tag"
        v-for="tag in tags"
        size="mini" closable
        :disable-transitions="false"
        @close="onDeleteTag(tag)"
      >{{tag}}</el-tag>
      <el-input
        class="input-new-tag"
        v-if="inputVisible"
        v-model="inputValue"
        ref="saveTagInput"
        size="small"
        @keyup.enter.native="onTagConfirm"
        @blur="onTagConfirm"
      ></el-input>
      <el-button v-else class="button-new-tag" size="mini" @click="showInput">添加标签</el-button>
    </fieldset>
    <fieldset>
      <legend class="_cv_title">分类</legend>
      <div>
        <el-tag v-for="clz of classes" :key="clz" size="mini" @close="onDeleteClass(clz)" closable>{{clz}}</el-tag>
        <el-popover
          placement="left"
          width="160"
        >
          <div>
            <div v-for="(clazz,idx) in candidateClasses" :key="idx">
              <el-checkbox v-model="checkValue[idx]" :label="clazz" border size="mini" @change="onCategoryChange"></el-checkbox>
            </div>
          </div>
          <el-button slot="reference" size="mini">+</el-button>
        </el-popover>
      </div>
    </fieldset>
    <fieldset>
      <legend class="_cv_title">基本信息</legend>
    <el-row class="_cv_desc">
      <el-col :span="12">
        <div class="_cv_name" v-for="name of metaNames">{{name}}:</div>
      </el-col>
      <el-col :span="12">
        <div class="_cv_value" v-for="value of metaValues">{{value}}</div>
      </el-col>
    </el-row>
    </fieldset>
  </div>
</template>

<script>
import Preview from '../Control/CVPreview'
import { i18n, formatOutput } from '@/../public/String'
import InputLabel from '../Control/CVInputLabel'
import { mapState } from 'vuex'
import { logger } from '@/../public/Logger'
import { resetArray, thumbnail2Base64, text2PNG } from '@/../public/Utility'
import { Cache } from '@/store/modules/CacheInstance'

export default {
  name: 'property-panel',
  data() {
    return {
      event: null,
      id: -1,
      thumbnail: '',
      tags: [],
      classes: [],
      inputVisible: false,
      inputValue: '',
      checkValue: [],
      filename: '',
      metaNames: [],
      metaValues: [],
      colors: []
    }
  },
  components: {
    Preview, InputLabel
  },
  computed: mapState({
    candidateClasses: state => state.Cache.classesName
  }),
  mounted() {
    this.event = this.$events.get('PropertyView')
    this.event.on('click', this.cleanProperty, this)
    this.$ipcRenderer.on('Property', this.onViewUpdate)
  },
  methods: {
    onViewUpdate(session, id, classname, value) {
      logger.debug(`onViewUpdate id: ${id}, class: ${classname}, value:`, value)
      this.filename = value.name
      resetArray(this, this.tags, value.tag)
      resetArray(this, this.classes, value.category)
      this.colors = value.color
      let type = ''
      for (let property of value.properties) {
        this.metaNames.push(i18n(property.name))
        if (value.name === 'size') {
          this.metaValues.push(this.getSize(parseInt(property.value)))
        } else {
          this.metaValues.push(property.value)
        }
        if (property.name === 'type') {
          type = property.value
        }
      }
      if (!value.preview) {
        if (Cache.icons[type]) {
          this.thumbnail = Cache.icons[type]
        } else {
          const width = 120
          const height = 180
          const png = text2PNG(type, width, height)
          this.thumbnail = png
          Cache.icons[type] = png
        }
      } else {
        this.thumbnail = thumbnail2Base64(value.preview)
      }
    },
    cleanProperty(filesid) {
      this.metaNames.splice(0, this.metaNames.length)
      this.metaValues.splice(0, this.metaValues.length)
      this.colors.splice(0, this.colors.length)
      this.id = filesid
      // if (Array.isArray(filesid)) {
      //   if (filesid.length === 1) {
      //     this.displayFileProperty(filesid[0])
      //   } else {
      //     this.displayMultiFileProperty(filesid)
      //   }
      // } else {
      //   if (filesid === 'all') {
      //   } else if (filesid === 'none') {
      //   }
      // }
    },
    onNameChaged(id, name) {
      if (this.id) {
        this.$store.dispatch('changeFileName', {id: this.id, filename: name})
      }
    },
    displayMultiFileProperty(filesid) {
      this.id = -1
      this.filename = filesid.length + '个文件'
    },
    getSize: (sz) => {
      let v = sz / 1024
      let unit = 'Kb'
      if (v / 1024 > 1) {
        unit = 'Mb'
        v = v / 1024
      }
      return v.toFixed(1) + unit
    },
    // displayFileProperty(imageID) {
    //   // console.info(this.$store)
    //   const files = this.$store.getters.getFiles([imageID])
    //   if (!files) return
    //   // console.info('PropertyPanel', files)
    //   const localize = new Intl.DateTimeFormat('zh-cn')
    //   if (files.length === 1) {
    //     let file = files[0]
    //     const schema = config.meta()
    //     let names = []
    //     let values = []
    //     console.info(schema)
    //     let displayTable = {}
    //     for (let item of schema) {
    //       displayTable[item.name] = item.display
    //     }
    //     const getItem = function (k, meta) {
    //       for (let item of meta) {
    //         if (item.name === k) return item
    //       }
    //       return null
    //     }
    //     this.filename = file.filename
    //     for (let item of file.meta) {
    //       if (item.name === 'filename') {
    //         // const meta = getItem(item.name, file.meta)
    //         // this.filename = meta.value
    //         continue
    //       }
    //       if (item.name === 'color' || item.type === 'bin') {
    //         continue
    //       }
    //       if (displayTable[item.name] !== false) {
    //         console.info('propterty name:', item.name, 'type:', item.type)
    //         names.push(i18n(item.name))
    //         const meta = getItem(item.name, file.meta)
    //         if (!meta) {
    //           if (!file[item.name]) {
    //             values.push('-')
    //           } else {
    //             values.push(file[item.name])
    //           }
    //         } else {
    //           if (item.name === 'size') {
    //             values.push(this.getSize(parseInt(file.size)))
    //           } else {
    //             if (item.type === 'date') {
    //               // console.info('time', Utility.convert2ValidDate(meta.value))
    //               const t = new Date(meta.value)
    //               // console.info('time 2', t)
    //               const dt = localize.format(t)
    //               console.info('date: ', dt, meta.value)
    //               values.push(dt)
    //             } else {
    //               values.push(formatOutput(meta.value))
    //             }
    //           }
    //         }
    //       }
    //     }
    //     this.metaNames = names
    //     this.metaValues = values
    //     this.thumbnail = (file.thumbnail === undefined ? file.path : file.thumbnail)
    //     this.tags = file.tag ? file.tag.slice(0) : []
    //     console.info('show tags', file, this.tags)
    //     this.classes = file.category
    //     const isClassExist = function (clsName, dynamicClass) {
    //       for (let name of dynamicClass) {
    //         if (name === clsName) return true
    //       }
    //       return false
    //     }
    //     for (let idx = 0; idx < this.candidateClasses.length; ++idx) {
    //       const candidate = this.candidateClasses[idx]
    //       // console.info('candicate:', candidate)
    //       if (isClassExist(candidate, this.classes)) {
    //         this.$set(this.checkValue, idx, true)
    //       } else {
    //         this.$set(this.checkValue, idx, false)
    //       }
    //     }
    //     // console.info('check state:', this.checkValue)
    //   }
    // },
    onDeleteTag(tag) {
      this.tags.splice(this.tags.indexOf(tag), 1)
      // this.$store.dispatch('updateImageProperty', {id: this.picture.id, key: 'tag', value: this.dynamicTags})
      this.$store.dispatch('removeTags', {id: this.id, tag: tag})
    },
    onDeleteClass(clazz) {
      // await this.$store.dispatch('removeClassOfFile', {id: this.id, path: clazz})
    },
    showInput() {
      if (!this.id) return
      this.inputVisible = true
      this.$nextTick(_ => {
        this.$refs.saveTagInput.$refs.input.focus()
      })
    },
    onTagConfirm() {
      if (!this.id) return
      let inputValue = this.inputValue
      if (inputValue) {
        this.tags.push(inputValue)
        // this.$ipcRenderer.send(Service.SET_TAG, {id: [this.picture.id], tag: this.dynamicTags})
        this.$store.dispatch('addTag', {fileID: this.id, tag: inputValue})
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
      let selectItem = []
      for (let idx in this.checkValue) {
        if (this.checkValue[idx] === true) {
          selectItem.push(this.candidateClasses[idx])
        }
      }
      console.info('class candidate', this.candidateClasses, 'selects:', selectItem)
      // compare difference class
      // find file that add to class
      const isInClass = function (clsName, classes, clean = false) {
        for (let idx = 0; idx < classes.length;) {
          if (clsName === classes[idx]) {
            if (clean === true) classes.splice(idx, 1)
            return true
          }
          idx += 1
        }
        return false
      }
      // this.$store.dispatch('addClass', {id: [this.picture.id], class: selectItem})
      // find file that remove from class
      for (let idx = this.classes.length - 1; idx >= 0; --idx) {
        if (!isInClass(this.classes[idx], selectItem, true)) {
          // this.dynamicClass.splice(idx, 1)
          await this.$store.dispatch('removeClassOfFile', {id: this.id, path: this.classes[idx]})
        }
      }
      // add not exist
      for (let idx = selectItem.length - 1; idx >= 0; --idx) {
        if (!isInClass(selectItem[idx], this.classes)) {
          console.info(selectItem[idx], idx)
          await this.$store.dispatch('addClassOfFile', {id: this.id, path: selectItem[idx]})
          // this.dynamicClass.push(selectItem[idx])
        }
      }
    }
  }
}
</script>

<style scoped>
._cv_property{
  margin: 5px 5px 2px 5px;
}
img{
  width: 100%;
  height: 250px;
}
.color-container{
  display: flex;
  align-items: center;
  justify-content: center;
}
.main-color{
  width: 20px;
  height: 35px;
  margin: 1px 3px 1px 3px;
  border-radius: 3px;
  display: inline-block;
}
.image-name{
  text-align: center;
}
._cv_title {
  font-weight: bold;
  font-family: "lucida grande", "lucida sans unicode", lucida, helvetica,
    "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif;
  font-size: 14px;
}
._cv_desc {
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
._cv_name{
  text-align: left;
}
._cv_value{
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
