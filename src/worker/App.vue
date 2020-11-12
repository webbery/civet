<template>
  <div id="app">
    <Guider v-if="isFirst"></Guider>
    <Splash v-else></Splash>
  </div>
</template>

<script>
// import DatabasePage from './components/DatabasePage'
import Splash from './components/Splash'
import Guider from './components/Guider'
import { CivetConfig } from '../public/CivetConfig'

export default {
  name: 'dbpage',
  components: {
    Splash, Guider
  },
  data() {
    const config = new CivetConfig()
    console.info('isFist:', config.isFirstTime())
    return {
      isFirst: config.isFirstTime()
    }
  },
  mounted() {
    if (!this.isFirst) {
      this.$ipcRenderer.send('ready')
    }
  }
}
</script>

<style>
  /* CSS */
.el-scrollbar__wrap {
  overflow-x: hidden;
}
</style>
