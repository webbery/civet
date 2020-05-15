import SKMeans from 'skmeans'

export default {
  sumaryColors: (pixels) => {
    // 使用聚类提取主色
    // console.info(pixels)
    let array = []
    for (let idx = 0; idx < pixels.length; idx += 3) {
      array.push([pixels[idx], pixels[idx + 1], pixels[idx + 2]])
    }
    let ret = SKMeans(array, 16)
    let counts = {
      '0': 0,
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
      '6': 0,
      '7': 0,
      '8': 0,
      '9': 0,
      '10': 0,
      '11': 0,
      '12': 0,
      '13': 0,
      '14': 0,
      '15': 0}
    // console.info('skmean:', ret)
    for (let idx of ret.idxs) {
      counts[idx] += 1
    }
    // console.info('counts', counts)
    let percents = {}
    for (let idx in counts) {
      let p = counts[idx] / ret.idxs.length
      if (p > 0.05) percents[idx] = p
    }
    // console.info('percents', percents)
    let colors = []
    for (let idx in percents) {
      const color = ret.centroids[idx]
      colors.push([Math.floor(color[0]), Math.floor(color[0]), Math.floor(color[0])])
    }
    console.info('colors', colors)
    return colors
  }
}
