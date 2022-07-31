import { startCivet, closeCivet, mainPage } from '../../modules/base'
const {describe, it} = require('mocha')

describe('# Command Test', function (resolve, reject) {
  this.timeout(60 * 1000)
  let mainWindowPage = mainPage
  // before((done) => {
  //   startCivet().then(result => {
  //     mainWindowPage = result
  //     console.debug('11111111')
  //     done()
  //   })
  // })
  it('execute command: library.create', function(done) {
    done()
  })
  // after((done) => {
  //   setTimeout(async () => {
  //     await closeCivet()
  //     done()
  //   }, 10*1000)
  // })
})