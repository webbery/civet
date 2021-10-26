const {expect, assert} = require('chai')

const extensionSelector = '.sidenav .el-icon-menu'
const ExtensionItems = '.extension'

async function switchExtensionPanel(page) {
  await page.waitForSelector(extensionSelector)
  const extensionBtn = await page.$(extensionSelector)
  await extensionBtn.click()
}

async function installExtension(page) {
  await switchExtensionPanel(page)
  const ExtensionInput = '._cv_panel input'
  await page.waitForSelector(ExtensionInput)
  const inputElm = await page.$(ExtensionInput)
  inputElm.type('helloworld')
  await inputElm.press('Enter')
  await page.waitForSelector(ExtensionItems)
  const extensions = await page.$$(ExtensionItems)
  assert(extensions.length >= 1)
  await extensions[0].click()
  // await page.waitFor(10000)
  await page.waitForTimeout(10000)
}

async function uninstallExtension(page) {
  await switchExtensionPanel(page)
  await page.waitForSelector(ExtensionItems)
  const extensions = await page.$$(ExtensionItems)
  assert(extensions.length >= 2)
  await extensions[1].click()
  // await page.waitFor(10000)
  await page.waitForTimeout(10000)
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