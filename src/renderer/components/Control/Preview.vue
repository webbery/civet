<template>
  <lazy-component @show="handler">
    <div class="frame">
    <img class="mini-cover" :src="src" width="100%">
    </div>
  </lazy-component>
</template>
<script>
export default {
  name: 'preview',
  props: {
    src: null
  },
  methods: {
    handler (component) {
      console.log('this component is showing')
    }
  }
}
</script>
<style scoped>
.mini-cover {
  padding: 0px;
}
.frame {
  border: 1px;
  align-items: center;
}
</style>