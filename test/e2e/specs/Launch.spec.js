import util from '../util'
import { startCivet, closeCivet, mainPage } from '../modules/base'

const {describe, it} = require('mocha')

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function createResourceDB(name) {
  // create cfg.json to add db
  const fs = require('fs')
  let generateSchema = function(name) {
    return '{"name":"' + name + 
    '","db":{"path":"testdb"},"extensions":[],"meta":[{"name":"color","value":"主色","type":"val/array","query":true,"size":3,"display":true},{"name":"size","value":"大小","type":"str","query":true,"display":true},{"name":"path","value":"路径","type":"str","display":true},{"name":"filename","value":"文件名","type":"str","display":true},{"name":"type","value":"类型","type":"str","query":true,"display":true},{"name":"datetime","value":"创建时间","type":"date","query":true,"display":true},{"name":"addtime","value":"添加时间","type":"date","query":true,"display":true},{"name":"width","value":"宽","type":"str","display":true},{"name":"height","value":"高","type":"str","display":true}]}'
  }
  fs.writeFileSync('cfg.json',
    '{"app":{"first":false,"version":"0.2.0","default":{"dbname":"' + name + 
    '", "layout": "mapview"}, "shortcut": {}},"resources":[' + generateSchema(name) +', ' + generateSchema('testdb2') + ']}')
}

createResourceDB('testdb')

describe('****************Start Test*************', function (resolve, reject) {
  this.timeout(60 * 1000);
  before((done) => {
    startCivet().then(result => {
      done()
    })
  })

  require('./cases/Command')
  require('./cases/Performance')
  require('./cases/UI')

  // it('mapview layout', async function() {
  //   await testMapView.test(mainWindowPage)
  // })
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
  
  after((done) => {
    setTimeout(async () => {
      await closeCivet()
      done()
    }, 10*1000)
  })
})
