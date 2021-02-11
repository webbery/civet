const NLP = require('./NLP')
const workerpool = require('workerpool')

workerpool.worker({
  getNouns: NLP.retrieveNoun
})
