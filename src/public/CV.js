import SKMeans from 'skmeans'

export default {
  sumaryColors: (pixels) => {
    // 使用聚类提取主色
    // console.info(pixels)
    let array = []
    console.info('----1---')
    for (let idx = 0; idx < pixels.length; idx += 3) {
      array.push([pixels[idx], pixels[idx + 1], pixels[idx + 2]])
    }
    console.info('----2---')
    let ret = SKMeans(array, 10)
    console.info('----3---')
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
      '9': 0}
    // console.info('skmean:', ret)
    for (let idx of ret.idxs) {
      counts[idx] += 1
    }
    // console.info('counts', counts)
    let percents = []
    for (let idx in counts) {
      let p = counts[idx] / ret.idxs.length
      percents.push({'index': idx, 'percent': p})
    }
    console.info('----4---')
    percents.sort((a, b) => { return b.percent - a.percent })
    console.info('percents', percents)
    let colors = []
    for (let idx in percents) {
      const color = ret.centroids[idx]
      if (colors.length < 4) {
        colors.push([Math.floor(color[0]), Math.floor(color[1]), Math.floor(color[2])])
      } else if (colors.length < 8 && percents[idx] > 0.05) {
        colors.push([Math.floor(color[0]), Math.floor(color[1]), Math.floor(color[2])])
      }
    }
    // console.info('colors', colors)
    return colors
  }
}
