<template>
  <div :id="boxid" class="image-container" :class="interact?activeClasses[activeIndex]:''"
    @mouseleave="onMouseLeave" @mouseover="onMouseOver" @mousemove="onMouseMove"
    @mousedown="onMouseDown" @mouseup="onMouseUp" @mousewheel="onMouseWheel">
      <el-scrollbar >
      <canvas :id="id" ></canvas>
      </el-scrollbar>
  </div>
</template>

<script>
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import bus from './utils/Bus'
// import Plugin from '@/../public/Plugin'
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
      scaleValue: 1,
      centerX: 0,
      centerY: 0,
      roateValue: 0,
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
      // const path = require('path')
      // const ext = path.extname(src)
      // this.loader = Plugin.getModuleByExt(ext)
      // await this.loader.load(src)
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
      let [startX, startY] = [0, 0]
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
      this.centerX = this.box.offsetWidth / 2
      this.centerY = this.box.offsetHeight / 2
      // console.info(startX, startY, this.originWidth, this.originHeight, this.box.offsetWidth, this.box.offsetHeight)
      this.context.translate(startX, startY)
      // this.context.drawImage(this.image, 0, 0, this.originWidth, this.originHeight)
      this.context.drawImage(this.image, 0, 0, this.originWidth, this.originHeight)
      this.context.setTransform(1, 0, 0, 1, 0, 0)
    },
    makeTransform() {
      const theta = this.roateValue * Math.PI / 180
      const dsin = Math.sin(theta)
      const dcos = Math.cos(theta)
      let dx = this.centerX - this.originWidth * this.scaleValue / 2
      let dy = this.centerY - this.originHeight * this.scaleValue / 2
      this.context.setTransform(
        this.scaleValue * dcos, -dsin,
        dsin, this.scaleValue * dcos,
        (1 - dcos) * this.centerX + dsin * this.centerY + dx, (1 - dcos) * this.centerY - dsin * this.centerX + dy)
    },
    moveViewport() {},
    scaleImage(scale) {
      if (scale < 0.2) scale = 0.2
      if (scale > 2) scale = 2
      this.scaleValue = scale
      this.context.clearRect(0, 0, this.box.offsetWidth, this.box.offsetHeight)

      this.makeTransform()
      this.context.drawImage(this.image, 0, 0, this.originWidth, this.originHeight)
    },
    resetViewport() {},
    onMouseLeave() {
      if (this.interact === false) return
      this.mouseStatus = 0
    },
    onMouseOver() {
      if (this.interact === false) return
      if (this.mouseStatus === 0) {
        this.activeIndex = 0
      }
    },
    onMouseMove(ev) {
      if (this.interact === false) return
      if (this.mouseStatus === 1) {
        this.activeIndex = 1
        if (this.scaleValue > 1) {
          this.context.clearRect(0, 0, this.box.offsetWidth, this.box.offsetHeight)
          this.context.translate(ev.movementX, ev.movementY)
          this.context.drawImage(this.image, 0, 0, this.originWidth, this.originHeight)
          console.info(this.context.transform)
        }
      }
    },
    onMouseUp() {
      if (this.interact === false) return
      this.activeIndex = 0
      this.mouseStatus = 0
    },
    onMouseDown() {
      if (this.interact === false) return
      this.activeIndex = 1
      this.mouseStatus = 1
      // console.info(window.getComputedStyle(this.$refs.container).height)
    },
    onMouseWheel(ev) {
      // let widthOffset = 0.05 * this.originWidth
      // let heightOffset = 0.05 * this.originHeight
      if (this.interact === false) return
      console.info(ev.deltaY, this.scaleValue)
      if (ev.deltaY > 0) {
        // 缩小
        // this.scaleViewport(-widthOffset, -heightOffset)
      } else {
        // this.scaleViewport(widthOffset, heightOffset)
        // this.scaleViewport()
      }
      this.context.scale(this.scale, this.scale)
    },
    rotateClockwise() {
      // const img = document.getElementById(this.id)
      // let test = [[[0, 0, 0], [1, 1, 1], [2, 2, 2]],
      //   [[3, 3, 3], [4, 4, 4], [5, 5, 5]],
      //   [[6, 6, 6], [7, 7, 7], [8, 8, 8]]]
      // const theta = 2 * Math.PI / 180
      // const dsin = Math.sin(theta)
      // const dcos = Math.cos(theta)
      this.roateValue = 20
      this.makeTransform()
      this.context.drawImage(this.image, 0, 0, this.originWidth, this.originHeight)
      // console.info('rotateClockwise', this.originWidth, this.originHeight, this.box.offsetWidth, this.box.offsetHeight, dx, dy)
      // this.box.offsetWidth = this.box.offsetWidth ^ this.box.offsetHeight
      // this.box.offsetHeight = this.box.offsetWidth ^ this.box.offsetHeight
      // const data = ImageProcess.rotate(img, this.originWidth, this.originHeight, true)
      // console.info(typeof (data))
      // let [ a1, a2 ] = [this.box.offsetWidth, this.box.offsetHeight]
      // this.box.offsetWidth = a2
      // this.box.offsetHeight = a1
      // let [ b1, b2 ] = [this.originWidth, this.originHeight]
      // this.originWidth = b2
      // this.originHeight = b1
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