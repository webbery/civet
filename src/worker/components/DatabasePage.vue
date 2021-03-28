<template>
<div>
  <el-button @click="loadImages()" type="primary" round>load</el-button>
  <el-button @click="testCorrection()" type="danger" round>testCorrection</el-button>
  <div>查询: <el-input type="textarea" :rows="2" v-model="sql" @keyup.enter="onQuery"></el-input><el-button type="primary" @click="onQuery">执行</el-button></div>
  <div class="console">
    <el-scrollbar style="height:32vh;" wrap-style="overflow-x:hidden;">
      {{msg}}
    </el-scrollbar>
  </div>
</div>
</template>

<script>
import storage from '../../public/Kernel'

export default {
  data() {
    return {
      msg: '',
      tableData: [],
      testImagesID: [],
      sql: ''
    }
  },
  mounted() {
    this.loadOtherDisplayInfo()
  },
  methods: {
    async loadImages() {
      // let snaps = await localStorage.getImagesSnap()
      // let data = []
      // for (let snapIdx in snaps) {
      //   let img = {imageid: snapIdx, step: snaps[snapIdx].step, name: snaps[snapIdx].name}
      //   let info = await localStorage.getImageInfo(snapIdx)
      //   console.info('loadImages', info)
      //   img.tag = this.convert(info.tag)
      //   img.keyword = this.convert(info.keyword)
      //   img.clazz = this.convert(info.category)
      //   img.fullpath = info.path
      //   img.size = info.size
      //   img.box = 'width: ' + info.width + ', height: ' + info.height
      //   img.type = info.type
      //   data.push(img)
      // }
      // this.tableData = data
    },
    loadOtherDisplayInfo() {
      let unclazzImages = storage.getUnClassifyFiles()
      let untagImages = storage.getUnTagFiles()
      let classes = storage.getClasses('/')
      this.msg = '未分类: ' + unclazzImages.length + '\n未标签: ' + untagImages.length + '\n'
      this.msg += JSON.stringify(classes)
    },
    onQuery() {
      console.info('query', this.sql)
      let result = storage.query(JSON.parse(this.sql))
      this.msg = JSON.stringify(result, null, 4)
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
}
</style>