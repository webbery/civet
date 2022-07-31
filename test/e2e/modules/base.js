const {expect, assert} = require('chai')
const { spawn } = require('child_process')

const CSSSettingBtn = '.sidenav .dock-bottom'
const CSSLayouts = '.sm-container div'
const CSSCounter = '._cv_item'

async function switchLayout(page, index) {
  await page.waitForSelector(CSSSettingBtn)
  const settingBtn = await page.$(CSSSettingBtn)
  await settingBtn.click()
  await page.waitForSelector(CSSLayouts)
  const layouts = await page.$$(CSSLayouts)
  assert(layouts.length > 2)
  const view = layouts[index]
  console.info(`switch layout[${layouts.length}]: ${index}`)
  await view.click()
}

async function getCounts(page) {
  await page.waitForSelector(CSSCounter)
  const counter = await page.$$(CSSCounter)
  let result = []
  for (let idx = 0; idx < counter.length; ++idx) {
    const value = await counter[idx].evaluate(() => document.querySelector('td').innerHTML)
    result.push(value)
  }
  return result
}

async function switchResourceDB(name) {
  
}

let app
let mainPage
const run = async () => {
  if (mainPage) {
    return mainPage
  }
  const port = 9200 // Debugging port
  const startTime = Date.now()
  const timeout = 20000 // Timeout in miliseconds
  const electron = require('electron')

  // Start Electron with custom debugging port
  let spawnedProcess = spawn(electron, ['.', `--remote-debugging-port=${port}`], {
    shell: true
  })

  // Log errors of spawned process to console
  spawnedProcess.stderr.on('data', data => {
    console.error(`stderr: ${data}`)
  })

  const puppeteer = require('puppeteer-core')
// Wait for Puppeteer to connect
  while (!app) {
    try {
      app = await puppeteer.connect({
        browserURL: `http://localhost:${port}`,
        defaultViewport: { width: 2060, height: 768 }
      })
    } catch (error) {
      if (Date.now() > startTime + timeout) {
        throw error
      }
    }
  }

  const pages = await app.pages();
  // console.info(pages)
  for (let page of pages) {
    const t = await page.title()
    console.info('title: ', t)
    if (t === 'civet') {
      mainPage = page
      break
    }
  }
  return mainPage
}

async function finish() {
  try {
    await app.close()
  } catch (err) {
    console.error('test error:', err)
    await app.close()
  }
}

module.exports = {
  startCivet: run,
  closeCivet: finish,
  mainPage: mainPage,
  switchLayout: function(page, index) {
    return switchLayout(page, index)
  },
  getCounts: getCounts
}