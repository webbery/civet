<template>
    <div>
        <div v-for="url in urls" :key="url" class="image">
        <el-image :src="url" lazy class="preview"></el-image>
        </div>
    </div>
</template>

<script>
export default {
  name: 'view-panel',
  data() {
    return {
      urls: []
    }
  },
  mounted() {
    this.initView('E:/Image')
  },
  methods: {
    initView() {
      // 从共享状态中获取图像数据，进行显示
      console.info(this.$store.expandImages)
      let images = ['file://F:/Image/DSC_2055.jpg', 'https://fuss10.elemecdn.com/a/3f/3302e58f9a181d2509f3dc0fa68b0jpeg.jpeg']
      //   for (let item of this.$store.expandImages) {
      //     images.push(item.realpath)
      //   }
      this.urls = images
    }
  }
}
</script>

<style scoped>
.image {
  display: inline;
  padding: 2px;
}
.preview {
  width: 20%;
}
</style>