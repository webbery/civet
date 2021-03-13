import electron from 'electron'
import pie from "puppeteer-in-electron"
import puppeteer from "puppeteer-core"
const fs = require('fs')

const config = {
  "app": {
    "first": false,
    "version": "0.1.1",
    "default": "test_db"
  },
  "resources": [
    {
      "name": "test_db",
      "db": {
        "path": "test_db"
      },
      "meta": [
        { "name": "color", "value": "主色", "type": "val/array", "query": true, "size": 3, "display": true },
        { "name": "size", "value": "大小", "type": "str", "query": true, "display": true },
        { "name": "path", "value": "路径", "type": "str", "display": true },
        { "name": "filename", "value": "文件名", "type": "str", "display": true },
        { "name": "type", "value": "类型", "type": "str", "query": true, "display": true },
        { "name": "datetime", "value": "创建时间", "type": "date", "query": true, "display": true },
        { "name": "addtime", "value": "添加时间", "type": "date", "query": true, "display": true },
        { "name": "width", "value": "宽", "type": "str", "display": true }, 
        { "name": "height", "value": "高", "type": "str", "display": true }
      ]
    }
  ]
}

const main = async () => {
  const browser = await pie.connect(app, puppeteer);

  console.info('+++++++++++++++')
  const window = new BrowserWindow();
  const url = 'dist/electron/main.js';
  await window.loadURL(url);

  const page = await pie.getPage(browser, window);
  console.log(page.url());
  // window.destroy();
};

main();

export default {
  run: main,
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
      fs.renameSync('cfg.json', 'cfg.json.bak')
    }
    // format test cfg.json
    fs.writeFileSync('cfg.json', JSON.stringify(config))

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
