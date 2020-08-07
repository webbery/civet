<template>
  <div :id="boxid" class="image-container" :class="interact?activeClasses[activeIndex]:''"
    @mouseleave="interact&&onMouseLeave" @mouseover="interact&&onMouseOver" @mousemove="interact&&onMouseMove"
    @mousedown="interact&&onMouseDown" @mouseup="interact&&onMouseUp" @mousewheel="interact&&onMouseWheel">
    <div v-if="scale>1">
      <el-scrollbar >
      <canvas :id="id" ></canvas>
    </el-scrollbar>
  </div>
  <div v-else>
    <canvas :id="id" ></canvas>
  </div>
  </div>
</template>

<script>
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import bus from './utils/Bus'
import log from '@/../public/Logger'
// import ImageProcess from '@/../public/ImageProcess'

export default {
  name: 'JImage',
  props: {
    interact: {
      type: Boolean,
      default: true
    },
    src: null
  },
  data() {
    return {
      canvas: null,
      context: null,
      activeIndex: 0,
      activeClasses: ['grab', 'grabbing', 'bigger', 'smaller'],
      image: null,
      originWidth: 0,
      originHeight: 0,
      imagewidth: 0,
      imageheight: 0,
      box: null,
      scale: 1,
      mouseStatus: 0 // 0-悬浮,1-按下,
    }
  },
  watch: {
    src: function (newSrc) {
      if (newSrc === '') return
      this.loadImage(newSrc)
    }
  },
  beforeCreate() {
    this.id = uuidv4()
    this.boxid = uuidv4()
  },
  async mounted() {
    if (this.src === '') return
    await this.loadImage(this.src)
    if (this.interact === true) {
      bus.on(bus.EVENT_SCALE_IMAGE, this.scaleImage)
    }
  },
  methods: {
    async readSource(src) {
      this.box = document.getElementById(this.boxid)
      this.canvas = document.getElementById(this.id)
      this.canvas.width = this.box.offsetWidth
      this.canvas.height = this.box.offsetHeight
      this.context = this.canvas.getContext('2d')
      // console.info(src)
      if (typeof src === 'string') {
        let {data, info} = await sharp(src).jpeg({force: true}).ensureAlpha()
          .raw().toBuffer({ resolveWithObject: true })
        // this.$store.dispatch('updateThumbnail', {path: this.src, thumbnail: data})
        log.info(info)
        this.originWidth = info.width
        this.originHeight = info.height
        this.imagewidth = info.width
        this.imageheight = info.height
        // console.info(data)
        let img = new ImageData(new Uint8ClampedArray(data), info.width, info.height)
        this.image = await createImageBitmap(img)
      } else {
        // console.info('object', this.imagewidth, this.imageheight)
        // let img = new ImageData(new Uint8ClampedArray(this.src), this.imagewidth, this.imageheight)
        // this.image = await createImageBitmap(img)
        // return this.src
      }
    },
    async loadImage(src) {
      await this.readSource(src)
      // console.info(this.originWidth, this.box.offsetWidth)
      let aspect = this.imagewidth / this.imageheight
      let windowAspect = this.box.offsetWidth / this.box.offsetHeight
      let startX = 0
      let startY = 0
      if (aspect > windowAspect) {
        // 扁图
        this.originWidth = this.box.offsetWidth
        this.originHeight = Math.ceil(this.box.offsetHeight / aspect)
        startY = (this.box.offsetHeight - this.originHeight) / 2
      } else {
        this.originWidth = Math.ceil(this.box.offsetWidth * aspect)
        this.originHeight = this.box.offsetHeight
        startX = (this.box.offsetWidth - this.originWidth) / 2
      }
      // console.info(startX, startY, this.originWidth, this.originHeight, this.box.offsetWidth, this.box.offsetHeight)
      // this.context.drawImage(this.image, 0, 0, this.originWidth, this.originHeight)
      // this.context.drawImage(this.image, startX - startX, startY - startY, this.originWidth, this.originHeight)
      this.context.drawImage(this.image, startX, startY, this.originWidth, this.originHeight)
    },
    moveViewport() {},
    scaleImage(scale) {
      if (scale < 0.2) scale = 0.2
      if (scale > 2) scale = 2
      let curWidth = this.imagewidth * scale
      let curHeight = this.imageheight * scale
      let startX = (this.box.offsetWidth - curWidth) / 2
      let startY = (this.box.offsetHeight - curHeight) / 2
      log.info(startX, startY)
      this.context.clearRect(0, 0, this.box.offsetWidth, this.box.offsetHeight)
      this.context.drawImage(this.image, startX, startY, curWidth, curHeight)
    },
    resetViewport() {},
    onMouseLeave() {
      this.mouseStatus = 0
    },
    onMouseOver() {
      if (this.mouseStatus === 0) {
        this.activeIndex = 0
      }
    },
    onMouseMove() {
      if (this.mouseStatus === 1) {
        this.activeIndex = 1
      }
    },
    onMouseUp() {
      this.activeIndex = 0
      this.mouseStatus = 0
    },
    onMouseDown() {
      if (this.scale === 1) return
      this.activeIndex = 1
      this.mouseStatus = 1
      console.info(window.getComputedStyle(this.$refs.container).height)
    },
    onMouseWheel(ev) {
      // let widthOffset = 0.05 * this.originWidth
      // let heightOffset = 0.05 * this.originHeight
      // console.info(ev.deltaY, this.scale)
      if (ev.deltaY > 0) {
        // 缩小
        // this.scaleViewport(-widthOffset, -heightOffset)
      } else {
        // this.scaleViewport(widthOffset, heightOffset)
        // this.scaleViewport()
      }
      // this.context.scale(this.scale, this.scale)
    },
    rotateClockwise() {
      // const img = document.getElementById(this.id)
      console.info(this.originWidth, this.originHeight)
      // let test = [[[0, 0, 0], [1, 1, 1], [2, 2, 2]],
      //   [[3, 3, 3], [4, 4, 4], [5, 5, 5]],
      //   [[6, 6, 6], [7, 7, 7], [8, 8, 8]]]
      this.context.rotate(Math.PI / 2)
      // const data = ImageProcess.rotate(img, this.originWidth, this.originHeight, true)
      // console.info(typeof (data))
      // this.canvas.src = data.src
      // img.appendChild(data)
      // this.context.drawImage(data, 0, 0)
    }
  }
}
</script>

<style scoped>
.image-container {
  height: 100%;
  text-align:center;
}
canvas {
  height: inherit;
  /* border: solid green; */
}
.grab {
  cursor: grab;
}
.grabbing {
  cursor: grabbing;
}
.bigger {
  cursor: zoom-in;
}
.smaller {
  cursor: zoom-out;
}
</style>