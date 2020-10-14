// import SKMeans from 'skmeans'
// import { GPU } from 'gpu.js'

// let getOrCreateGPU = (function () {
//   let gpu
//   return function () {
//     return gpu || (gpu = new GPU())
//   }
// })()

// const rotateKernel = function(colors, width, height) {
//   const pixel = colors[width - this.thread.x - 1][this.thread.y]
//   this.color(pixel[0] / 256, pixel[1] / 256, pixel[2] / 256, 1)
//   // const pixel = colors[height - this.thread.y - 1][this.thread.z][width - this.thread.x - 1]
// }

// const loop = function (input) {
//   let sum = 0
//   for (let i = 0; i < 64; ++i) {
//     sum += input[this.thread.x]
//   }
//   return sum
// }
// function kmeans_gpu(data, k) {
//   const length = data.length
//   const findCentriod = getOrCreateGPU().createKernel(function (point, rest) {
//     let distance = 0
//     for (let i = 0; i < length; ++i) {
//       pi = point[i]
//       pi[this.thread.x]
//       // distance =
//     }
//   })
// }

// function image2Array(image) {
//   const gpu = getOrCreateGPU()
//   const kernel = gpu.createKernel(function(image) {
//     const pixel = image[this.thread.y][this.thread.x]
//     this.color(pixel.r, pixel.g, pixel.b, pixel.a)
//   }, {
//     output: [image.width, image.height],
//     graphical: true,
//     pipeline: true
//   })
//   kernel(image)
//   const result = kernel.getPixels(true)
//   kernel.destroy()
//   return result
// }

// function loadImage(fullpath) {
//   return new Promise((resolve, reject) => {
//     let img = new Image()
//     img.src = fullpath
//     img.onload = () => {
//       resolve(img)
//     }
//     img.onerror = reject
//   })
// }
export default {
  sumaryColors: async (fullpath) => {
    // 使用聚类提取主色
    // const image = await loadImage(fullpath)
    // const array = image2Array(image)
    // console.info('----1---')
    // console.info(array)
    // console.info('----2---')

    // const sharp = require('sharp')
    // const pixels = await sharp(fullpath)
    //   .resize(356, 400)
    //   .toBuffer()
    // let array = []
    // for (let idx = 0; idx < pixels.length; idx += 3) {
    //   array.push([pixels[idx], pixels[idx + 1], pixels[idx + 2]])
    // }
    // let ret = SKMeans(array, 10)
    // // let ret = kmeans_gpu(array, 10)
    // // console.info('----3---')
    // let counts = {
    //   '0': 0,
    //   '1': 0,
    //   '2': 0,
    //   '3': 0,
    //   '4': 0,
    //   '5': 0,
    //   '6': 0,
    //   '7': 0,
    //   '8': 0,
    //   '9': 0}
    // // console.info('skmean:', ret)
    // for (let idx of ret.idxs) {
    //   counts[idx] += 1
    // }
    // // console.info('counts', counts)
    // let percents = []
    // for (let idx in counts) {
    //   let p = counts[idx] / ret.idxs.length
    //   percents.push({'index': idx, 'percent': p})
    // }
    // console.info('----4---')
    // percents.sort((a, b) => { return b.percent - a.percent })
    // console.info('percents', percents)
    let colors = []
    // for (let idx in percents) {
    //   const color = ret.centroids[idx]
    //   if (colors.length < 4) {
    //     colors.push([Math.floor(color[0]), Math.floor(color[1]), Math.floor(color[2])])
    //   } else if (colors.length < 8 && percents[idx] > 0.05) {
    //     colors.push([Math.floor(color[0]), Math.floor(color[1]), Math.floor(color[2])])
    //   }
    // }
    // console.info('colors', colors)
    return colors
  },
  similarity: (histogram1, histogram2) => {}
}
