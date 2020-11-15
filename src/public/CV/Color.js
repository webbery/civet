import * as tf from '@tensorflow/tfjs-node'

function zeroFactorWithDiv(frac) {
  const delta = frac.step(0)
  const tmp = frac.add(tf.scalar(1).sub(delta))
  return delta.div(tmp)
}

function equal21(val, color) {
  const dC = val.sub(color)
  return dC.step(0)
}

function rgb2hsv(rgb, length) {
  const shape = [length, 3]
  const uiRGB = tf.tensor(rgb, shape)
  const normalRGB = uiRGB.mul(1 / 255.0)
  // console.info('222222222')
  // normalRGB.print()
  // uiRGB.print()
  const [R, G, B] = tf.split(normalRGB, [1, 1, 1], 1)
  // console.info('+++++++++++')
  const maxVal = tf.maximum(tf.maximum(R, G), B)
  const minVal = tf.minimum(tf.minimum(R, G), B)
  const diff = maxVal.sub(minVal)
  // H
  const delta = zeroFactorWithDiv(diff)
  const deltaR = equal21(maxVal, R)
  const deltaG = equal21(maxVal, G)
  const deltaB = equal21(maxVal, B)
  const elm1 = G.sub(B).mul(delta).mul(deltaR)
  const elm2 = B.sub(R).mul(delta).add(tf.scalar(2)).mul(deltaG)
  const elm3 = R.sub(G).mul(delta).add(tf.scalar(4)).mul(deltaB)
  const c = elm1.add(elm2).add(elm3).mul(diff.step(0))
  const h = tf.scalar(60).mul(c).div(tf.scalar(360.0))
  const H = tf.scalar(1.0).sub(h)
  // console.info('HHHHHHHHHHHHHH')
  // H.print()
  // S
  const factor = zeroFactorWithDiv(maxVal)
  const S = diff.mul(factor)
  // V
  const V = maxVal
  return [H, S, V]
}

export default {
  rgb2hsv: (rgb, length) => {
    return rgb2hsv(rgb, length)
  },
  rgb: (h, s, v) => {}
}
