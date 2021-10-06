const {expect, assert} = require('chai')

const extensionSelector = '.sidenav .el-icon-menu'

function installExtension(page) {
  return page.$(extensionSelector).then((extensionBtn) => {
    console.info('extension Button', extensionBtn)
    return extensionBtn.click()
  }).then((result) => {
    return page.waitFor(1000)
  }).then(() => {
    return page.$('.panel input')
  }).then((result) => {
    return page.waitFor(1000)
  }).then((inputElm) => {
    inputElm.type('helloworld')
    return inputElm.press('Enter')
  }).then(() => {
    return page.waitFor(10000)
  }).then(() =>{
    return page.$$('.extension')
  }).then((extensions) => {
    assert(extensions.length >= 1)
    return extensions[0].click()
  })
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