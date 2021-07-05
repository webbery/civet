
const {expect, assert} = require('chai')

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
  run: (page) => {
    return testColor(page).then(() => {
      return testMeta(page)
    })
  }
}