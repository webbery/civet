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
        <el-checkbox @change="(val)=>{onSelectChange(val, scope.row)}"></el-checkbox>
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
      label="类型"
      width="90">
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
      msg: '',
      tableData: [],
      testImagesID: []
    }
  },
  async mounted() {
    await this.loadImages()
    await this.loadOtherDisplayInfo()
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
    arrayValidate(arr, msg) {
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
    arrayAssert(condition, msg) {
      if (condition) return
      this.msg = msg
      throw new Error(this.msg)
    },
    onSelectChange(val, row) {
      if (val === true) {
        this.testImagesID.push(row.imageid)
      } else {
        this.testImagesID.remove(row.imageid)
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
        img.clazz = this.convert(info.category)
        img.fullpath = info.path
        img.size = info.size
        img.box = 'width: ' + info.width + ', height: ' + info.height
        img.type = info.type
        data.push(img)
      }
      this.tableData = data
    },
    async loadOtherDisplayInfo() {
      let unclazzImages = await localStorage.getUncategoryImages()
      let untagImages = await localStorage.getUntagImages()
      this.msg = '未分类: ' + unclazzImages.length + '\n未标签: ' + untagImages.length
    },
    async testCorrection() {
      await this.testAddTag('标签测试')
      await this.testRemoveTag('标签测试')
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
    async testAddTag(tag) {
      if (!this.testImagesID.length) return
      for (let idx of this.testImagesID) {
        await localStorage.addTag(idx, tag)
        const img = await localStorage.getImageInfo(idx)
        this.arrayValidate(img.tag, img.label + ' tag error')
        this.arrayAssert(img.tag.indexOf(tag) > -1, this.testImagesID[idx] + ' add tag fail')
      }
      await this.loadImages()
    },
    async testRemoveTag(tag) {
      if (!this.testImagesID.length) return
      for (let idx of this.testImagesID) {
        await localStorage.removeTag(tag, idx)
        const img = await localStorage.getImageInfo(idx)
        this.arrayValidate(img.tag, img.label + ' tag error')
        this.arrayAssert(img.tag.indexOf(tag) < 0, this.testImagesID[idx] + ' remove tag fail')
      }
      await this.loadImages()
    },
    async testAddClazz() {
      if (!this.testImagesID.length) return
      await localStorage.addCategory('分类测试', '')
      for (let idx of this.testImagesID) {
        await localStorage.addCategory('分类测试', '', idx)
        await localStorage.addCategory('子分类', '父分类', idx)
        await localStorage.addCategory('三级分类', '一级分类/二级分类', idx)
        const img = await localStorage.getImageInfo(idx)
        this.arrayValidate(img.category, img.label + ' tag error')
      }
      await this.loadImages()
      await this.loadOtherDisplayInfo()
    },
    async testRemoveClazz() {
      await localStorage.removeCategory('分类测试', '')
      await this.loadImages()
      await this.loadOtherDisplayInfo()
    }
  }
}
</script>

<style scoped>
.console {
  margin: 5px;
  border: solid 1px black;
  color: brown;
  border-radius: 5px;
  height: 5vh;
}
</style>