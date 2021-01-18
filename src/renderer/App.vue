<template>
  <div id="app">
    <LandingPage></LandingPage>
    <Guider ref="guider"></Guider>
  </div>
</template>

<script>
import LandingPage from '@/components/LandingPage'
import Guider from '@/components/Guider'
// import CV from '@/../public/ImageProcess'
import { config } from '@/../public/CivetConfig'
import Service from '@/components/utils/Service'

export default {
  name: 'civet',
  components: {
    LandingPage,
    Guider
  },
  mounted() {
    // const test = [240, 0, 0, 250, 235, 215]
    // rgb2hsv(test, 2)
    // let data = {data: test, info: {width: 2, height: 1}}
    // CV.sumaryColors(data)
    if (config.isFirstTime() || !config.isDBExist()) {
      const guider = this.$refs.guider
      console.info('show model')
      guider.showModal()
    }
    this.$nextTick(() => {
      this.$store.dispatch('init')
    })
    // regist ipc message process function
    this.$ipcRenderer.on(Service.ON_IMAGE_UPDATE, this.onUpdateImages)
  },
  methods: {
    onUpdateImages(error, updateImages) {
      if (error) console.log(error)
      this.$store.dispatch('addFiles', updateImages)
    }
  },
  destroyed: function() {
    const Storage = require('../public/Kernel')
    Storage.release()
  }
}
</script>
