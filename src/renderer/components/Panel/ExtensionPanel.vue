<template>
  <div>
    <el-scrollbar style="height:99vh;">
      <div v-for="(extension, idx) in extensions" :key="idx">
        <div>{{extension.name}}</div>
        <button class="extension" @click="onInstall(extension)">install</button>
      </div>
    </el-scrollbar>
  </div>
</template>
<script>
import Service from '../utils/Service'
export default {
  name: 'extension-panel',
  components: {
  },
  data() {
    return {
      extensions: [
        {
          name: '测试',
          desc: '描述'
        }
      ]
    }
  },
  mounted() {},
  methods: {
    onInstall(extension) {
      this.$ipcRenderer.send(Service.INSTALL_EXTENSION, extension.name)
    }
  }
}
</script>
<style scoped>
.extension {
  border: none;
  background-color: #4CAF50;
  display: inline-block;
  border-radius: 4px;
  width: 25%;
  height: 20px;
}
</style>