<template>
  <div class="image" @mouseleave="onMouseLeave" @mouseover="onMouseOver" @mousemove="onMouseMove" @mousedown="onMouseDown">
    <canvas :id="id"></canvas>
  </div>
</template>

<script>
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'

export default {
  name: 'JImage',
  props: {
    interact: {
      type: Boolean,
      default: true
    },
    src: {
      type: String,
      default: ''
    },
    id: {
      type: String,
      default: uuidv4()
    }
  },
  data() {
    return {
      context: null,
      imageData: null,
      meta: null
    }
  },
  async created() {
  },
  async mounted() {
    await this.readSource()
    let img = this.context.createImageData(this.meta.width, this.meta.height)
    img.data.set(this.imageData)
    this.context.putImageData(img, 0, 0, 0, 0, this.meta.width, this.meta.height)
  },
  methods: {
    async readSource() {
      if (this.src.indexOf('base64') > 0) {
      } else {
        let {data, info} = await sharp(this.src).ensureAlpha()
          .raw().toBuffer({ resolveWithObject: true })
        console.info('image info', info, data, this.src)
        this.meta = info
        this.imageData = data
        const canvas = document.getElementById(this.id)
        this.context = canvas.getContext('2d')
        // this.imageData = this.context.getImageData(0, 0, this.width, this.height)
      }
    },
    onMouseLeave() {},
    onMouseOver() {},
    onMouseMove() {},
    onMouseDown() {}
  }
}
</script>

<style scoped>
.image {
  border: solid black;
}
canvas {
  width: 99%;
  height: inherit;
  border: solid green;
}
</style>