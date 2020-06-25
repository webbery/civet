<template>
<div>
  <el-table
    :data="tableData"
    height="86vh"
    border
    style="width: 100%">
    <el-table-column
      prop="imageid"
      label="ID"
      width="30">
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
  <el-button @click="runTest()">RunTest</el-button>
</div>
</template>

<script>
import localStorage from '../LocalStorage'
export default {
  data() {
    return {
      tableData: []
    }
  },
  async mounted() {
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
    runTest() {}
  }
}
</script>