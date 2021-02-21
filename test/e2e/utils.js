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
    // console.info('beforeAll', __dirname)
    // backup develop database
    if (fs.existsSync('./cfg.json')) {
      const cfg = JSON.parse(fs.readFileSync('./cfg.json'))
      if (cfg.app.default !== 'test') {
        fs.renameSync('cfg.json', 'cfg.json.bak')
      }
    }
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
    this.timeout(10000)

    if (this.app && this.app.isRunning()) {
      this.app.stop()
    }

    console.info('afterAll')
    if (fs.existsSync('./cfg.json.bak')) {
      fs.renameSync('cfg.json.bak', 'cfg.json')
    }
  }
}
