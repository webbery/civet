<template>
  <div>
    <el-tabs v-model="activeName" @tab-click="handleClick">
      <el-tab-pane label="标签" name="second">
          <el-tree :data="tagData" :props="defaultProps" ></el-tree>
      </el-tab-pane>
      <el-tab-pane label="目录" name="first">
          <el-tree :data="directoryData" :props="defaultProps" ></el-tree>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
export default {
  name: 'organized-panel',
  data() {
    return {
      tagData: [
        {
          label: '一级 1'
        }
      ],
      directoryData: [ ]
    }
  },
  mounted() {
    this.initDirectory('F:/Image/')
    console.info('init directory')
  },
  methods: {
    initDirectory(dir) {
      let fs = require('fs')
      let path = require('path')
      let async = require('async')
      let Segment = require('segment')
      let POSTAG = Segment.POSTAG
      let segment = new Segment()
      segment.useDefault()
      let directoryData = []
      let self = this
      fs.readdir(dir, function(err, files) {
        let dirs = []
        // 每加载1000个数据更新一次UI（待实现）
        async.each(files, function (filename, done) {
          const fullpath = path.join(dir, filename)
          fs.stat(fullpath, function(err, data) {
            let validNames = filename.match(/[\u4e00-\u9fa5]+/g)
            let tags = []
            if (validNames !== null) {
              const segs = segment.doSegment(validNames.join(''))
              for (let word of segs) {
                if (word.p & (POSTAG.D_N | POSTAG.A_NR | POSTAG.A_NS | POSTAG.A_NT)) {
                  tags.push(word.w)
                }
              }
            }
            if (data.isFile()) {
              if (self.isImageFile(filename)) {
                const item = {
                  label: filename,
                  type: 'img',
                  realpath: fullpath,
                  name: filename,
                  tags: tags
                }
                directoryData.push(item)
              }
            }
            // else if (data.isDirectory()) {
            // //   const children = []
            // //   this.initDirectory()
            // }
            if (err) console.log(err)
            done(null)
          })
        }, function() {
          self.directoryData = directoryData
          self.$store.dispatch('updateImageList', directoryData)
        })
        if (err) console.log(err)
        console.log(dirs)
      })
    },
    isImageFile(filename) {
      const suffix = ['.jpg', '.jpeg', '.bmp', '.png']
      for (let suf of suffix) {
        if (filename.includes(suf)) return true
      }
      return false
    },
    handleNodeClick(node) {
      console.info(node)
    }
  }
}
</script>

<style scoped>
</style>