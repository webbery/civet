<template>
  <div id="app">
    <LandingPage></LandingPage>
    <Guider ref="guider"></Guider>
  </div>
</template>

<script>
import LandingPage from '@/components/LandingPage'
import Guider from '@/components/Guider'
import CV from '@/../public/ImageProcess'
import { CivetConfig } from '@/../public/CivetConfig'

export default {
  name: 'civet',
  components: {
    LandingPage,
    Guider
  },
  mounted() {
    const test = [240, 0, 0, 250, 235, 215]
    // rgb2hsv(test, 2)
    let data = {data: test, info: {width: 2, height: 1}}
    CV.sumaryColors(data)
    const config = new CivetConfig()
    if (config.isFirstTime()) {
      const guider = this.$refs.guider
      console.info('show model')
      guider.showModal()
    }
    // regist ipc message process function
    this.$nextTick(() => {
      this.$store.dispatch('init')
    })
  },
  destroyed: function() {
    const Storage = require('../public/Kernel')
    Storage.release()
  }
}
</script>
