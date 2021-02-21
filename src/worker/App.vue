<template>
  <div id="app">
    <Splash></Splash>
    <!-- <DatabasePage ></DatabasePage> -->
  </div>
</template>

<script>
import DatabasePage from './components/DatabasePage'
import Splash from './components/Splash'
import { config } from '../public/CivetConfig'

export default {
  name: 'dbpage',
  components: {
    Splash, DatabasePage
  },
  data() {
    console.info('isFist:', config.isFirstTime())
    console.info('env:', process.env.NODE_ENV)
    return {
      isFirst: config.isFirstTime(),
      isDevelop: process.env.NODE_ENV === 'development'
    }
  },
  mounted() {
    // if (!this.isFirst) {
    this.$ipcRenderer.send('ready')
    // }
  }
}
</script>

<style>
  /* CSS */
.el-scrollbar__wrap {
  overflow-x: hidden;
}
</style>
