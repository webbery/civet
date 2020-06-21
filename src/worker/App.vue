<template>
  <div id="app">
    <DatabasePage></DatabasePage>
  </div>
</template>

<script>
import DatabasePage from './components/DatabasePage'

export default {
  name: 'dbpage',
  components: {
    DatabasePage
  }
}
</script>

<style>
  /* CSS */
.el-scrollbar__wrap {
  overflow-x: hidden;
}
</style>
