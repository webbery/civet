import { startCivet, closeCivet, mainPage } from '../../modules/base'
const {describe, it} = require('mocha')

describe('# UI Test', function (resolve, reject) {
  const testBrowserExtension = require('../../modules/testBrowserExtension')
  const testLocalExtension = require('../../modules/testExtension')
  const testClassPanel = require('../../modules/testClassifyPanel')
  const testClassicalView = require('../../modules/testClassicalView')
  const testMapView = require('../../modules/testMapView')
  let mainWindowPage
  before((done) => {
    (async function() {
      mainWindowPage = await startCivet()
      done()
    })()
  })
  it('add operation in classify panel ', function(done) {
    (async function() {
      try{
        await testClassPanel.addClass(mainWindowPage)
        done()
      } catch (err) {
        done(err)
      }
    })()
  })
  it('install local extensions', function(done) {
    (async function() {
      try{
        await testLocalExtension.install(mainWindowPage)
        done()
      } catch (err) {
        done(err)
      }
    })()
  })
  it('browser extension: add files', function(done) {
    // create process and use websocket as a browser extension to add resource
    testBrowserExtension.run(done, mainWindowPage)
  })
  it('waterfall layout view', function(done) {
    (async function () {
      try{
        await testClassicalView.test(mainWindowPage)
        console.info('waterfall layout view finish')
        done()
      } catch (err) {
        done(err)
        util.printLog()
      }
    })()
  })
  it('uninstall local extension', function(done) {
    (async function() {
      try{
        await testLocalExtension.uninstall(mainWindowPage)
        done()
      } catch (err) {
        done(err)
      }
    })()
  })
  it('clean operation in classify panel ', function(done) {
    (async function() {
      try {
        await testClassPanel.removeClass(mainWindowPage)
        done()
      } catch (err) {
        done(err)
      }
    })()
  })
  after((done) => {
    if (testBrowserExtension) testBrowserExtension.close()
    done()
  })
})