<template>
  <div>
      <el-slider v-model="scaleValue" @input="scaleChange()" size="mini"></el-slider>
  </div>
</template>
<script>
export default {
  name: 'image-operator'
}
</script>

<style scoped>

</style>