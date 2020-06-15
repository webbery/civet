<template>
  <div>
      <el-slider v-model="scaleValue" @input="scaleChange()" size="mini"></el-slider>
  </div>
</template>
<script>
export default {
  name: 'image-operator',
  data() {
    return {
      scaleValue: 1
    }
  },
  methods: {
    scaleChange() {}
  }
}
</script>

<style scoped>

</style>