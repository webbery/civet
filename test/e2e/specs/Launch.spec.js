import puppeteer from 'puppeteer-core'
const electron = require('electron')
const { spawn } = require('child_process')
const {describe, it} = require('mocha')
const {expect, assert} = require('chai')

let spawnedProcess
let app
let mainWindowPage

const run = async () => {
  const port = 9200 // Debugging port
  const startTime = Date.now()
  const timeout = 20000 // Timeout in miliseconds

  // Start Electron with custom debugging port
  spawnedProcess = spawn(electron, ['.', `--remote-debugging-port=${port}`], {
    shell: true
  })

  // Log errors of spawned process to console
  spawnedProcess.stderr.on('data', data => {
    console.error(`stderr: ${data}`)
  })

  // Wait for Puppeteer to connect
  while (!app) {
    try {
      app = await puppeteer.connect({
        browserURL: `http://localhost:${port}`,
        defaultViewport: { width: 1280, height: 768 }
      })
    } catch (error) {
      if (Date.now() > startTime + timeout) {
        throw error
      }
    }
  }

  const pages = await app.pages();
  // console.info(pages)
  const title = await pages[0].title()
  if (title === 'civet') {
    mainWindowPage = pages[0]
  } else {
    mainWindowPage = pages[1]
  }
}

function createResourceDB(name) {
  // create cfg.json to add db
  const fs = require('fs')
  fs.writeFileSync('cfg.json',
    '{"app":{"first":false,"version":"0.2.0","default":"' + name + 
    '"},"resources":[{"name":"' + name + 
    '","db":{"path":"testdb"},"extensions":[],"meta":[{"name":"color","value":"主色","type":"val/array","query":true,"size":3,"display":true},{"name":"size","value":"大小","type":"str","query":true,"display":true},{"name":"path","value":"路径","type":"str","display":true},{"name":"filename","value":"文件名","type":"str","display":true},{"name":"type","value":"类型","type":"str","query":true,"display":true},{"name":"datetime","value":"创建时间","type":"date","query":true,"display":true},{"name":"addtime","value":"添加时间","type":"date","query":true,"display":true},{"name":"width","value":"宽","type":"str","display":true},{"name":"height","value":"高","type":"str","display":true}]}]}')
}

createResourceDB('testdb')
// before(function(resolve, reject) {
//     console.info('0000000000')
// })

describe('verify browser extension', function (resolve, reject) {
  this.timeout(60 * 1000);
  const testBrowserExtension = require('../modules/testBrowserExtension')
  const testLocalExtension = require('../modules/testExtension')
  const testFileOperation = require('../modules/testFileOperation')
  before((done) => {
    run().then((result) => {
      done()
    })
  })
  // it('add operation in classify panel ', async function() {
  //   await mainWindowPage.waitFor(6000)
  //   let btnAddClass = await mainWindowPage.$('.icon-add-class')
  //   expect(btnAddClass).not.to.be.null
  //   await btnAddClass.click()
  //   await mainWindowPage.waitFor(1000)
  //   const editClass = await mainWindowPage.$('.vtl-input')
  //   editClass.type('helloworld')
  //   await mainWindowPage.waitFor(1000)
  //   await editClass.press('Enter')
  // })
  // it('install local extensions', async function() {
  //   await mainWindowPage.waitFor(2000)
  //   await testLocalExtension.install(mainWindowPage)
  // })
  it('browser extension: add files', function(done) {
    // create process and use websocket as a browser extension to add resource
    testBrowserExtension.run(done, mainWindowPage)
  })
  // it('file property', async function() {
  //   const files = await mainWindowPage.$$('.vue-waterfall-slot')
  //   expect(files).not.to.be.null
  //   expect(files.length).to.be.above(0)
  //   await files[0].click()
  //   await mainWindowPage.waitFor(1000)
  //   await testFileOperation.run(mainWindowPage)
  // })
  // it('file classify', async function() {
  //   const fieldsets = await mainWindowPage.$$('.property fieldset')
  //   expect(fieldsets.length).to.be.above(0)
  //   await fieldsets[1].click()
  //   const classes = await mainWindowPage.$$('.el-popper label')
  //   expect(fieldsets.length).to.be.above(0)
  // })
  // it('file tags', function(done) {
  //   done()
  // })
  
  // it('search file', function(done) {
  //   done()
  // })
  // it('file menu operation', async function() {
  //   let files = await mainWindowPage.$$('.vue-waterfall-slot')
  //   expect(files).not.to.be.null
  //   const beforeLength = files.length
  //   expect(beforeLength).to.be.above(0)
  //   await files[0].click({button: 'right'})
  //   const menus = await mainWindowPage.$$('.cm-ul li')
  //   expect(menus.length).to.be.above(1)
  //   await menus[1].click()
  //   files = await mainWindowPage.$$('.vue-waterfall-slot')
  //   expect(beforeLength).to.be.above(files.length)
  // })
  // it('clean operation in classify panel ', async function() {
  //   let itemClasses = await mainWindowPage.$$('.vtl-node-content')
  //   const beforeLength = itemClasses.length
  //   expect(beforeLength).to.be.above(0)
  //   await itemClasses[0].click({button: 'right'})
  //   const menus = await mainWindowPage.$$('.cm-ul li')
  //   await menus[3].click()
  //   itemClasses = await mainWindowPage.$$('.vtl-node-content')
  //   expect(beforeLength).to.be.above(itemClasses.length)
  // })
  // it('uninstall local extension', async function() {
  //   await testLocalExtension.uninstall(mainWindowPage)
  // })
  after((done) => {
    try {
      setTimeout(() => {
        testBrowserExtension.close()
        app.close().then(() => {
          done()
        })
      }, 10*1000)
    } catch(err) {
      console.error('test error:', err)
      app.close().then(() => {
        done()
      })
    }
  })
})

