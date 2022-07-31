const {describe, it} = require('mocha')
describe('# Performance Test', function (resolve, reject) {
  console.info('Performance Test')
  it('loading performance', function(done) {
    done()
  })
  after((done) => {
    console.debug('perf done')
    done()
  })
})