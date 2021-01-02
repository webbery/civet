<template>
  <lazy-component @show="handler">
    <img class="mini-cover" :src="src" width="100%">
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