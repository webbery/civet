
const {expect, assert} = require('chai')

const CSSName = '.image-name .context'
const CSSNameInput = '.image-name input'

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

module.exports = {
  assertName: async function(page, expression) {},
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
  }
}