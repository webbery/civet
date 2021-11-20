
const {expect, assert} = require('chai')

const CSSName = '.image-name .context'
const CSSNameInput = '.image-name input'
const CSSItems = '._cv_property fieldset'
const CSSTagButton = 'button'
const CSSTagInput = '._cv_property fieldset .el-input input'
const CSSClassButton = 'dev span span button'
const CSSClassSelector = '[id|=el-popover-]'
const CSSClassItems = 'div'
const TagIndex = 0
const ClassIndex = 1
const DetailIndex = 2

function testColor(page) {
  return page.$$('.main-color').then((colors) => {
    expect(colors).to.have.lengthOf(6)
    return new Promise(function(resolve, reject){
      resolve(1)
    })
  })
}

function testMeta(page) {
  return page.$$('.value').then((meta) => {
    assert(meta.length >= 2)
    return new Promise(function(resolve, reject){
      resolve(2)
    })
  })
}

async function getItem(page, index) {
  console.info('wait for 1')
  await page.waitForSelector(CSSItems)
  console.info('wait for 2')
  const items = await page.$$(CSSItems)
  return items[index]
}

module.exports = {
  updateName: async function(page, name) {
    await page.waitForSelector(CSSName)
    let item = await page.$(CSSName)
    await page.waitForTimeout(1000)
    // await page.waitForTimeout(1000)
    await item.click({ clickCount: 2, delay: 100 })
    await page.waitForSelector(CSSNameInput)
    const input = await page.$(CSSNameInput)
    input.type(name)
    await page.waitForTimeout(1000)
    await input.press('Enter')
    await page.waitForTimeout(500)
    await page.waitForSelector(CSSName)
    const value = await page.evaluate(() => document.querySelector('.image-name .context').innerHTML)
    assert(value === name)
  },
  addTag: async function(page, value) {
    const tag = await getItem(page, TagIndex)
    const btnAdd = await tag.$(CSSTagButton)
    await btnAdd.click()
    await page.waitForSelector(CSSTagInput)
    const input = await page.$(CSSTagInput)
    input.type(value)
    await page.waitForTimeout(1000)
    await input.press('Enter')
  },
  removeTag: async function(page) {
    const tag = await getItem(page, TagIndex)
    console.info('tag:', tag)
    let btnX = await tag.$('span i')
    const originCount = btnX.length
    assert(originCount > 0)
    await btnX.click()
    await page.waitForTimeout(1000)
    btnX = await tag.$('span i')
    const currentCount = btn.length
    assert(originCount === (currentCount + 1))
  }
}