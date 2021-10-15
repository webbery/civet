const base = require('./base')
const {expect, assert} = require('chai')

const CLASSICAL_LAYOUT = 0

const CSSFolder = '.folder'
const CSSImage = '._cv_waterfall'

module.exports = {
  selectResource: async function(page) {
    await base.switchLayout(page, CLASSICAL_LAYOUT)
    await page.waitForSelector(CSSImage)
    const images = await page.$$(CSSImage)
    assert(images.length > 0)
    await images[0].click()
  },
  search: async function(page) {
    await base.switchLayout(page, CLASSICAL_LAYOUT)
  },
  removeResource: async function(page) {
    await base.switchLayout(page, CLASSICAL_LAYOUT)
  },
  selectClass: async function(page) {
    await base.switchLayout(page, CLASSICAL_LAYOUT)
    await page.waitForSelector(CSSFolder)
    const folders = await page.$$(CSSFolder)
    assert(folders.length > 0)
  },
  intoClass: async function(page) {
    await base.switchLayout(page, CLASSICAL_LAYOUT)
  },
  removeClass: async function(page) {
    await base.switchLayout(page, CLASSICAL_LAYOUT)
  }
}