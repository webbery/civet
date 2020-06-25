<template>
<div>
  <el-table
    :data="tableData"
    height="80vh"
    border
    style="width: 100%">
    <el-table-column
      fixed="right"
      label="ID"
      width="30">
      <template slot-scope="scope">
        <el-checkbox v-model="checked"></el-checkbox>
      </template>
    </el-table-column>
    <el-table-column
      prop="name"
      label="名称"
      width="180">
    </el-table-column>
    <el-table-column
      prop="tag"
      label="标签">
    </el-table-column>
    <el-table-column
      prop="clazz"
      label="分类">
    </el-table-column>
    <el-table-column
      prop="keyword"
      label="关键字">
    </el-table-column>
    <el-table-column
      prop="box"
      label="宽高">
    </el-table-column>
    <el-table-column
      prop="size"
      label="大小">
    </el-table-column>
    <el-table-column
      prop="type"
      label="类型">
    </el-table-column>
  </el-table>
  <el-button @click="loadImages()" type="primary" round>load</el-button>
  <el-button @click="testCorrection()" type="danger" round>testCorrection</el-button>
  <el-button @click="testAddImage()" round>testAddImage</el-button>
  <el-button @click="testRemoveImage()" round>testRemoveImage</el-button>
  <el-button @click="testAddTag()" round>testAddTag</el-button>
  <el-button @click="testRemoveTag()" round>testRemoveTag</el-button>
  <el-button @click="testAddClazz()" round>testAddClass</el-button>
  <el-button @click="testRemoveClazz()" round>testRemoveClass</el-button>
  <div class="console">{{msg}}</div>
</div>
</template>

<script>
import localStorage from '../LocalStorage'
import { ImageParser } from '../Image'
import util from 'util'

export default {
  data() {
    return {
      msg: 'error:',
      tableData: [],
      testImagesID: [5]
    }
  },
  async mounted() {
    await this.loadImages()
  },
  methods: {
    convert(arr) {
      if (!arr) return ''
      let result = []
      for (let data of arr) {
        if (data) result.push(data)
        else if (data === null) result.push('null')
        else if (data === undefined) result.push('undefined')
      }
      return result.toString()
    },
    arrayAssert(arr, msg) {
      for (let val of arr) {
        if (val === null) {
          this.msg = msg + ' :\t array contain null element'
          throw new Error(this.msg)
        }
        if (val === undefined) {
          this.msg = msg + ' :\t array contain undefined element'
          throw new Error(this.msg)
        }
      }
    },
    async loadImages() {
      let snaps = await localStorage.getImagesSnap()
      let data = []
      for (let snapIdx in snaps) {
        let img = {imageid: snapIdx, step: snaps[snapIdx].step, name: snaps[snapIdx].name}
        let info = await localStorage.getImageInfo(snapIdx)
        console.info(info)
        img.tag = this.convert(info.tag)
        img.keyword = this.convert(info.keyword)
        img.clazz = this.convert(info.clazz)
        img.fullpath = info.path
        img.size = info.size
        img.box = 'width: ' + info.width + ', height: ' + info.height
        img.type = info.type
        data.push(img)
      }
      this.tableData = data
    },
    async testAddImage() {
      const fs = require('fs')
      try {
        let fullpath = 'F:/Image/熔岩/jr-korpa-Ud32uVNR23g-unsplash.jpg'
        const info = fs.statSync(fullpath)
        const parser = new ImageParser()
        let parse = util.promisify(parser.parse)
        const img = await parse(fullpath, info)
        console.info(img)
        this.testImagesID.push(img.id)
        this.arrayAssert(img.tag, 'img.tag')
        this.arrayAssert(img.keyword, 'img.keyword')
      } catch (err) {
      }
      await this.loadImages()
    },
    async testRemoveImage() {
      if (!this.testImagesID.length) return
      for (let idx of this.testImagesID) {
        await localStorage.removeImage(idx)
      }
      await this.loadImages()
    },
    async testAddTag() {},
    async testRemoveTag() {}
  }
}
</script>

<style scoped>
.console {
  border: solid 1px black;
  color: brown;
  border-radius: 5px;
  height: 10vh;
}
</style>