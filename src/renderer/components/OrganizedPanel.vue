<template>
  <div class="organize">
    <el-tabs v-model="activeName" @tab-click="handleClick">
      <el-tab-pane label="标签" name="second">
          <el-tree :data="tagData" :props="defaultProps" ></el-tree>
      </el-tab-pane>
      <el-tab-pane label="目录" name="first" class="directory">
          <el-tree :data="directoryData" :props="dirProps" ></el-tree>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import bus from './utils/Bus'

export default {
  name: 'organized-panel',
  data() {
    return {
      tagData: [
        {
          label: '一级 1'
        }
      ],
      directoryData: [],
      importor: []
    }
  },
  computed: {
    loadDirectory() {
      console.info('computed：', this.$store.EventBus.importDirectory)
      return this.$store.EventBus.importDirectory
    }
  },
  mounted() {
    bus.on(bus.EVENT_UPDATE_IMAGE_IMPORT_DIRECTORY, this.updateLoadingDirectories)
    this.$ipcRenderer.on(bus.WORKER_UPDATE_IMAGE_DIRECTORY, this.updateDisplayImageList)
    this.$ipcRenderer.send('mounted', 'mounted')
    // this.initDirectory('F:/test/')
    // 持久化数据记录
    // let levelup = require('levelup')
    // let leveldown = require('leveldown')
    // let db = levelup(leveldown('civet'))
    // db.put('name', 'levelup', function (err) {
    // })
  },
  methods: {
    updateLoadingDirectories(dir) {
      // 从数据库中导入该文件夹中的所有图片
      console.info('----update: ', dir)
    },
    updateDisplayImageList(appendFiles) {
      // console.info('recieve from worker message:', appendFiles)
      // 存储新数据到数据库中
      // 更新目录窗口
      let dirs = {}
      let updateImages = []
      for (let item of appendFiles) {
        if (dirs[item.path] === undefined) {
          dirs[item.path] = []
        }
        dirs[item.path].push({label: item.filename})
        updateImages.push({label: item.filename, realpath: item.path + item.filename})
      }
      // 更新视图共享数据
      this.$store.dispatch('updateImageList', updateImages)
      for (let item in this.directoryData) {
        // console.info('***', item.label, dirs[item.label])
        if (dirs[item.label] !== undefined) {
          item.children.push(dirs[item.label])
          delete dirs[item.label]
        }
      }
      for (let k in dirs) {
        this.directoryData.push({label: k, children: dirs[k]})
      }
    },
    importImages(evt) {
      console.log(evt.data)
      // self.$store.dispatch('updateImageList', directoryData)
      // else self.directoryData.push({label: rootName, children: directoryData})
    },
    initDirectory(dir, rootName) {
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
        let parent = []
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
            } else if (data.isDirectory()) {
              parent.push(filename)
            }
            if (err) console.log(err)
            done(null)
          })
        }, async function() {
          fs.appendFileSync('test.js', 'hello world')
          console.info('append file')
          if (self.directoryData === null) {
            self.directoryData = directoryData
            self.$store.dispatch('updateImageList', directoryData)
          }
        })
        if (err) console.log(err)
      })
    },
    isImageFile(filename) {
      const suffix = ['.jpg', '.jpeg', '.bmp', '.png']
      for (let suf of suffix) {
        if (filename.toLowerCase().includes(suf)) return true
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
.directory{
  height: 100%;
}
</style>