import puppeteer from 'puppeteer-core'
const electron = require('electron')
const { spawn } = require('child_process')

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
  console.info('page 1:', await pages[0].title())
  console.info('page 2:', await pages[1].title())
  mainWindowPage = pages[0]

  // await page.waitForSelector("#demo");
  // const text = await page.$eval("#demo", element => element.innerText);
  // assert(text === "Demo of Electron + Puppeteer + Jest.");
  // await page.close();
}

run()
  .then(async () => {
    console.log('Browser Extension Test')
    // create process and use websocket as a browser extension to add resource
    const WebSock = require('ws')
    const sock = new WebSock('ws://localhost:21313')
    let dbs = []
    sock.on('message', (data) => {
      console.info(data)
      switch(data.id) {
        case 'config':
          dbs = data['config']['db']
          break;
        default:
          break;
      }
    })
    sock.on('open', function (data) {
      console.info('websocket open', data)
    })
    let wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    while(dbs.length === 0) {
      await wait(1)
    }
    // const msgAddResource = {id: 'load', db: extensionContext.currentDB, data: { url: path} }
    // sock.send(msgAddResource)
    console.log('Browser Extension Test Passed')
  })
  .finally(() => {
    console.log('close Test Electron')
    // app.close()
  })
  .catch(error => {
    console.error(`Test failed. Error: ${error.message}`)
    // kill(spawnedProcess.pid, () => {
    //   process.exit(1);
    // });
  })

// const main = async () => {
//   console.info('+++++++++++++++')
//   const browser = await pie.connect(app, puppeteer);

//   console.info('+++++++++++++++')
//   const window = new BrowserWindow({
//     show: true
//   });
//   const url = 'dist/electron/main.js';
//   await window.loadURL(url);

//   const page = await pie.getPage(browser, window);
//   console.log(page.url());
//   // window.destroy();
// };

// describe('Launch', async function () {
//   await main();
//   console.info('-------------')

//   test('update database', () => {})
//   test('validate init database', async (client) => {
//     // const visible = await client.$('#guider-config').isVisible()
//     // expect(visible).to.equal(true)
//     // const dbInput = client.$('input[placeholder="资源库名称"]')
//     // expect(dbInput).not.to.equal(undefined)
//     // await dbInput.setValue('1111111')
//     // const dbPath = client.$('input:disabled')
//     // const value = await dbPath.isEnabled()
//     // await dbPath.setValue(__dirname)
//     // console.info('44444444444:', value)
//   })
//   test('validate add files', async (client) => {

//   })
//   test('validate property', () => {})
//   test('validate web view', () => {})
//   test('validate detail view', () => {})
//   test('validate class ability', () => {})
//   test('validate tag ability', () => {})
//   test('validate tag mananger', () => {})
//   test('validate search', () => {})
//   test('validate remove database', () => {

//   })
// })
