const {expect, assert} = require('chai')

const extensionSelector = '.sidenav .el-icon-menu'

async function installExtension(page) {
  await page.waitForSelector(extensionSelector)
  const extensionBtn = await page.$(extensionSelector)
  await extensionBtn.click()
  const ExtensionInput = '._cv_panel input'
  await page.waitForSelector(ExtensionInput)
  const inputElm = await page.$(ExtensionInput)
  inputElm.type('helloworld')
  await inputElm.press('Enter')
  await page.waitForSelector('.extension')
  const extensions = await page.$$('.extension')
  assert(extensions.length >= 1)
  await extensions[0].click()
}

function uninstallExtension(page) {
  return page.waitFor(5000).then(() => {
    return page.$(extensionSelector)
  }).then((extensionBtn) => {
    return extensionBtn.click()
  }).then(() => {
    return page.waitFor(1000)
  }).then(() => {
    return page.$$('.extension')
  }).then((extensions) => {
    assert(extensions.length >= 2)
    return extensions[1].click()
  }).then(() => {
    return page.waitFor(10000)
  })
}
module.exports = {
  install: (page) => {
    // install hello world extension
    return installExtension(page)
  },
  uninstall: (page) => {
    // remove hello world extension
    return uninstallExtension(page)
  }
}