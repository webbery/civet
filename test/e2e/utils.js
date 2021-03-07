import electron from 'electron'
import { Application } from 'spectron'
const fs = require('fs')

export default {
  afterEach () {
    // this.timeout(10000)

    // if (this.app && this.app.isRunning()) {
    //   return this.app.stop()
    // }
  },
  beforeEach () {
    // this.timeout(10000)
    // this.app = new Application({
    //   path: electron,
    //   args: ['dist/electron/main.js'],
    //   startTimeout: 10000,
    //   waitTimeout: 10000
    // })
    // return this.app.start()
  },
  beforeAll() {
    console.info('beforeAll', __dirname)
    // backup develop database
    if (fs.existsSync('cfg.json')) {
      console.info('eeeexxxxiissstt')
      fs.renameSync('cfg.json', 'cfg.json.bak')
    }
    console.info('path:', electron)
    this.timeout(10000)
    this.app = new Application({
      path: electron,
      args: ['dist/electron/main.js'],
      startTimeout: 10000,
      waitTimeout: 10000
    })
    return this.app.start()
  },
  afterAll() {
    console.info('aaaaaaaaaaaa')
    this.timeout(60000)
    console.info('bbbbbbbbbbbb')

    if (this.app && this.app.isRunning()) {
      // this.app.stop()
    }

    console.info('afterAll')
    // if (fs.existsSync('./cfg.json.bak')) {
    //   fs.renameSync('cfg.json.bak', 'cfg.json')
    // }
  }
}
