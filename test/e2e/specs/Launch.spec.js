import puppeteer from 'puppeteer-core'
const electron = require('electron')
const { spawn } = require('child_process')

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
let spawnedProcess
let app
let mainWindowPage
let sock

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

  // await page.waitForSelector("#demo");
  // const text = await page.$eval("#demo", element => element.innerText);
  // assert(text === "Demo of Electron + Puppeteer + Jest.");
  // await page.close();
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
run()
  .then(async () => {
    console.log('Browser Extension Test')
    // create process and use websocket as a browser extension to add resource
    const WebSock = require('ws')
    sock = new WebSock('ws://localhost:21313')
    let dbs = []
    sock.on('message', (str) => {
      const data = JSON.parse(str)
      console.info(data)
      switch(data.id) {
        case 'config':
          dbs = data['config']['db']
          console.info('recieve:', dbs)
          break;
        default:
          console.info('recieve 111:', data.id)
          break;
      }
    })
    sock.on('open', function (data) {
      console.info('websocket open', data)
    })
    while(dbs.length === 0) {
      await wait(1000)
    }
    const msgAddResource = {id: 'load', db: dbs[0], data: { url: './show.JPG'} }
    sock.send(JSON.stringify(msgAddResource))
    console.log('Browser Extension Test Passed')
  })
  .finally(async () => {
    await wait(10*1000)
    await app.close()
    console.log('close Test Electron')
  })
  .catch(async (error) => {
    console.error(`Test failed. Error: ${error.message}`)
    await app.close()
    // kill(spawnedProcess.pid, () => {
    //   process.exit(1);
    // });
  })
