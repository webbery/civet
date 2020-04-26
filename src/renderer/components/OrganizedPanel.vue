<template>
  <div class="organize">
    <el-tabs v-model="activeName" @tab-click="handleClick" class="custom">
      <el-tab-pane label="资源" name="second">
        <el-scrollbar style="height:95vh;">
          <el-tree :data="resourceData" :render-content="renderContent"></el-tree>
        </el-scrollbar>
      </el-tab-pane>
      <el-tab-pane label="目录" name="first" class="directory" >
        <el-scrollbar style="height:90vh;">
          <el-tree :data="directoryData" ></el-tree>
        </el-scrollbar>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import bus from './utils/Bus'
import localStorage from './utils/localStorage'

export default {
  name: 'organized-panel',
  data() {
    return {
      resourceData: [
        {
          label: '分类',
          icon: 'el-icon-suitcase',
          children: []
        },
        {
          label: '标签',
          icon: 'el-icon-collection-tag',
          children: []
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
    this.init()
  },
  methods: {
    updateLoadingDirectories(dir) {
      // 从数据库中导入该文件夹中的所有图片
      console.info('----update: ', dir)
    },
    updateDisplayImageList(appendFiles) {
      // console.info('recieve from worker message:', appendFiles)
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
      // 更新目录窗口
      localStorage.set('directories', this.directoryData)
    },
    init() {
      this.directoryData = localStorage.get('directories')
    },
    renderContent(h, {node, data, store}) {
      console.info('renderContent', data)
      return (
        <span>
          <i class={data.icon}></i>
          <span> {node.label}</span>
        </span>
      )
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
el-tab-pane {
  overflow-y:auto;
  overflow-x:hidden;
}
.el-tabs--left .el-tabs__nav.is-left, .el-tabs--left .el-tabs__nav.is-right, .el-tabs--right .el-tabs__nav.is-left, .el-tabs--right .el-tabs__nav.is-right {
  height: 100%;
  overflow-y: scroll;
}
.custom .el-tabs__item{
  line-height: 20px;
  font-size: 12px;
  font-weight: 300;
}
.custom .is-top{
  height: 20px;
}
</style>