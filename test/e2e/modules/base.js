const {expect, assert} = require('chai')

const CSSSettingBtn = '.sidenav .dock-bottom'
const CSSLayouts = '.sm-container div'
const CSSCounter = '._cv_item'

async function switchLayout(page, index) {
  await page.waitForSelector(CSSSettingBtn)
  const settingBtn = await page.$(CSSSettingBtn)
  await settingBtn.click()
  await page.waitForSelector(CSSLayouts)
  const layouts = await page.$$(CSSLayouts)
  assert(layouts.length > 2)
  const view = layouts[index]
  console.info(`switch layout[${layouts.length}]: ${index}`)
  await view.click()
}

async function getCounts(page) {
  await page.waitForSelector(CSSCounter)
  const counter = await page.$$(CSSCounter)
  let result = []
  for (let idx = 0; idx < counter.length; ++idx) {
    const value = await counter[idx].evaluate(() => document.querySelector('td').innerHTML)
    result.push(value)
  }
  return result
}

async function switchResourceDB(name) {
  
}

module.exports = {
  switchLayout: function(page, index) {
    return switchLayout(page, index)
  },
  getCounts: getCounts
}