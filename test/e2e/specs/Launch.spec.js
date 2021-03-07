import utils from '../utils'

function test(title, cb) {
  it(title, async function() {
    console.info('-----------')
    await this.app.client.windowByIndex(1).then(async () => {
      await cb(this.app.client)
    });
    console.info('finish')
  })
}

describe('Launch', function () {
  this.beforeAll(utils.beforeAll)
  // beforeEach(utils.beforeEach)
  // afterEach(utils.afterEach)

  // it('validate window count', async function () {
  //   let count = await this.app.client.getWindowCount();
  //   assert.equal(count, 2)
  // return this.app.client.getTitle()
  //   .then(title => {
  //     console.info(title)
  //     expect(title).to.equal('civet')
  //   })
  // })
  // it('validate application title', function() {
  //   this.app.client.windowByIndex(1).then(() => {
  //     let title = this.app.client.getTitle()
  //     expect(title).to.equal('civet')
  //   })
  // })
  test('update database', () => {})
  test('validate init database', async (client) => {
    const visible = await client.$('#guider-config').isVisible()
    // expect(title).to.equal('civet')
    expect(visible).to.equal(true)
    const dbInput = client.$('input[placeholder="资源库名称"]')
    expect(dbInput).not.to.equal(undefined)
    await dbInput.setValue('1111111')
    const dbPath = client.$('input[placeholder="资源库路径"]')
    await dbPath.setValue(__dirname)
    console.info('44444444444')
  })
  test('validate add files', () => {})
  test('validate property', () => {})
  test('validate web view', () => {})
  test('validate detail view', () => {})
  test('validate class ability', () => {})
  test('validate tag ability', () => {})
  test('validate tag mananger', () => {})
  test('validate search', () => {})
  test('validate remove database', () => {

  })
  this.afterAll(utils.afterAll)
})
