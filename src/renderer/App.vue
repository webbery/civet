<template>
  <div id="app">
    <LandingPage></LandingPage>
  </div>
</template>

<script>
import LandingPage from '@/components/LandingPage'
import Storage from '@/../public/Kernel'
import CV from '@/../public/ImageProcess'

export default {
  name: 'civet',
  components: {
    LandingPage
  },
  updated: function() {
    this.$nextTick(() => {
      console.info('all page updated.')
    })
  },
  mounted() {
    const test = [240, 0, 0, 250, 235, 215]
    // rgb2hsv(test, 2)
    let data = {data: test, info: {width: 2, height: 1}}
    CV.sumaryColors(data)
  },
  destroyed: function() {
    Storage.release()
  }
}
</script>
