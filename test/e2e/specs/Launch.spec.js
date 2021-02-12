import utils from '../utils'

describe('Launch', function () {
  beforeEach(utils.beforeEach)
  afterEach(utils.afterEach)

  // it('validate window count', async function () {
  //   let count = await this.app.client.getWindowCount();
  //   assert.equal(count, 2)
    // return this.app.client.getTitle()
    //   .then(title => {
    //     console.info(title)
    //     expect(title).to.equal('civet')
    //   })
  // })
  it('validate application title', function() {
    this.app.client.windowByIndex(1).then(() => {
      let title = this.app.client.getTitle()
      expect(title).to.equal('civet')
    })
  })
})
