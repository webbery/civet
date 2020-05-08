<template>
  <div id="app">
    <LandingPage></LandingPage>
  </div>
</template>

<script>
import LandingPage from '@/components/LandingPage'
import localStorage from '@/../public/LocalStorage'

export default {
  name: 'civet',
  components: {
    LandingPage
  },
  beforeDestroy: async () => {
    await localStorage.release()
  }
}
</script>

<style>
  /* CSS */
.el-scrollbar__wrap {
  overflow-x: hidden;
}
</style>
