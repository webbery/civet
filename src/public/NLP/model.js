import * as tf from '@tensorflow/tfjs'

const model = (async function initModels () {
  const { app } = require('electron')
  const dir = app.getAppPath()
  const model = await tf.loadLayersModel(dir + '/search/default/model.json')
  return model
})()

export default {
  predict: async (image) => {
    const features = tf.FromPixels(image)
    const prediction = model.predict(features)
    console.info(prediction)
  }
}
