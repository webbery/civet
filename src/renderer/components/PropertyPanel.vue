<template>
    <div>
        <div>路径: {{picture.realpath}}</div>
        <div>标签:</div>
    </div>
</template>

<script>
export default {
  name: 'property-panel',
  computed: {
    picture() {
      return this.$store.state.Selector.picture
    }
  }
}
</script>

<style scoped>

</style>