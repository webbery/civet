<template>
    <div>
        <div v-for="image in imageList" :key="image" class="image" @click="onImageClick(image)">
        <el-image :src="image.realpath" lazy class="preview"></el-image>
        <div class="name">{{image.label}}</div>
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
  },
  computed: {
    imageList() {
      return this.$store.state.Picture.imageList
    }
  },
  methods: {
    initView() {
      // 从共享状态中获取图像数据，进行显示
      console.info('-------', this.$store.state.Picture.imageList)
      // let images = ['file://F:/Image/DSC_2055.jpg', 'https://fuss10.elemecdn.com/a/3f/3302e58f9a181d2509f3dc0fa68b0jpeg.jpeg']
      //   for (let item of this.$store.expandImages) {
      //     images.push(item.realpath)
      //   }
    },
    onImageClick(image) {
      this.$store.dispatch('updateSelection', image)
    }
  }
}
</script>

<style scoped>

.image {
  max-width: 19%;
  display: inline-block;
  padding: 2px;
}
.preview {
  text-align: center;
}
.name {
  /* max-width: 19%; */
  text-overflow:ellipsis;
  white-space:nowrap;
  overflow:hidden;
}
</style>