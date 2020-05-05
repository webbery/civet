<template>
  <div>
    <el-image :src="image.path" lazy class="preview" @click="onImageClick($event, image)"/>
  </div>
</template>

<script>
export default {
  name: 'image-panel',
  data() {
    return {
      image: null
    }
  },
  created() {
    console.info('000', this.$route.params)
    this.image = this.$route.params
  },
  mounted() {
    console.info('1111', this.$route.params)
    this.image = this.$route.params
  }
}
</script>