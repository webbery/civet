
const CSSSettingBtn = '.sidenav .el-icon-setting'
const CSSLayouts = '.sm-container div'

async function switchLayout(page, index) {
  await page.waitForSelector(CSSSettingBtn)
  const settingBtn = await page.$(CSSSettingBtn)
  await settingBtn.click()
  await page.waitForSelector(CSSLayouts)
  const layouts = await page.$$(CSSLayouts)
  const view = layouts[index]
  await view.click()
}

module.exports = {
  switchLayout: function(page, index) {
    return switchLayout(page, index)
  }
}