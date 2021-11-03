
const CSSSettingBtn = '.sidenav .el-icon-setting'
const CSSLayouts = '.sm-container div'
const CSSCounter = '._cv_item'

async function switchLayout(page, index) {
  await page.waitForSelector(CSSSettingBtn)
  const settingBtn = await page.$(CSSSettingBtn)
  await settingBtn.click()
  await page.waitForSelector(CSSLayouts)
  const layouts = await page.$$(CSSLayouts)
  const view = layouts[index]
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

module.exports = {
  switchLayout: function(page, index) {
    return switchLayout(page, index)
  },
  getCounts: getCounts
}