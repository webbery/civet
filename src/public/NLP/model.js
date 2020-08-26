import * as tf from '@tensorflow/tfjs'

const {app} = require('electron')
const dir = app.getAppPath()
const model = await tf.loadLayersModel(dir + '/search/default/model.json')

export default {
  predict: (image) => {
    const features = tf.FromPixels(image)
    const prediction = model.predict(features)
    console.info(prediction)
  }
}