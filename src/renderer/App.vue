<template>
  <div id="app">
    <LandingPage></LandingPage>
  </div>
</template>

<script>
import LandingPage from '@/components/LandingPage'
import Storage from '@/../public/Kernel'

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
  destroyed: function() {
    Storage.release()
  }
}
</script>
