<template>
  <div id="app">
    <LandingPage></LandingPage>
  </div>
</template>

<script>
import LandingPage from '@/components/LandingPage'
import CV from '@/../public/ImageProcess'

export default {
  name: 'civet',
  components: {
    LandingPage
  },
  updated: function() {

  },
  mounted() {
    const test = [240, 0, 0, 250, 235, 215]
    // rgb2hsv(test, 2)
    let data = {data: test, info: {width: 2, height: 1}}
    CV.sumaryColors(data)
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
