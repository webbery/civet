import Color from './Color'
import * as tf from '@tensorflow/tfjs-node'

const wide = tf.scalar(16, 'float32')
const squard = wide.mul(wide)
const bin = squard.mul(wide)

function color2indx(pixel) {
  const vr = pixel[0].div(wide)
  const vg = pixel[1].div(wide)
  const vb = pixel[2].div(wide)
  const row = vg.mul(squard)
  return vr.mul(bin).mul(squard).add(row).add(vb)
}

function indx2hsv(indices) {
  const frac = bin.mul(squard)
  const vv = indices.div(frac)
  const h = vv.mul(wide)
  console.info('HHHHHHHHH')
  h.print()
  indices = indices.sub(vv.mul(frac))
  const vw = indices.div(squard)
  const s = vw.mul(wide)
  console.info('SSSSSSS')
  s.print()
  indices = indices.sub(vw.mul(squard))
  const v = indices.mul(wide)
  console.info('VVVVVVV')
  s.print()
  return [h.div(tf.scalar(180, 'float32')), s.div(tf.scalar(255, 'float32')), v.div(tf.scalar(255, 'float32'))]
}

export default {
  colorHistogram: (image) => {
    let hsv = Color.rgb2hsv(image.data, image.info.width * image.info.height)
    const indices = color2indx(hsv).reshape([-1])
    const fAmounts = indices.floor()
    const arr = fAmounts.arraySync()
    const amounts = tf.tensor1d(arr, 'int32')
    const counts = tf.oneHot(amounts, 4096).sum(0)
    const result = tf.topk(counts, 20)
    // result.values.print()
    // result.indices.print()
    hsv = indx2hsv(result.indices)
  }
}
