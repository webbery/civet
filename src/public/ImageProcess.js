import Histgram from './CV/Histogram'

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
  sumaryColors: async (pixels) => {
    Histgram.colorHistogram(pixels)
    // return colors
  },
  similarity: (histogram1, histogram2) => {}
}
