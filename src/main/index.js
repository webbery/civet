'use strict'

import { app, BrowserWindow, Menu, ipcMain, protocol, globalShortcut } from 'electron'
import { autoUpdater } from 'electron-updater'
const path = require('path')
const fs = require('fs')

app.setPath('crashDumps', path.join(__dirname, './logs'))
// var util = require('util')
// var logFile = fs.createWriteStream('/Users/v_yuanwenbin/debug.log', {flags: 'w'})
// var log_stdout = process.stdout;

function initUpdater() {
  const updaterCacheDirName = 'civet'
  const path = require('path')
  const updatePendingPath = path.join(autoUpdater.app.baseCachePath, updaterCacheDirName, 'pending')
  console.info('update dir:', updatePendingPath)
  if (fs.existsSync(updatePendingPath)) fs.rmdir(updatePendingPath)
  const updateURL = 'https://download.fastgit.org/webbery/civet/releases/download'
  autoUpdater.autoDownload = false
  if (process.env.NODE_ENV === 'development') {
    autoUpdater.updateConfigPath = path.join(__dirname, 'default-app-update.yml')
  } else {
    autoUpdater.updateConfigPath = path.join(__dirname, '../../../app-update.yml')
  }
  autoUpdater.setFeedURL(updateURL)

  autoUpdater.on('checking-for-update', () => {
    sendWindowMessage(workerWindow, 'checking-for-update', 'Checking for update...')
  })
  autoUpdater.on('update-available', (info) => {
    sendWindowMessage(workerWindow, 'update-available', 'Update available.')
  })
  autoUpdater.on('update-not-available', (info) => {
    sendWindowMessage(workerWindow, 'update-not-available', 'Update not available.')
  })
  autoUpdater.on('error', (err) => {
    sendWindowMessage(workerWindow, 'error', 'Error in auto-updater. ' + err)
  })
  autoUpdater.on('download-progress', (progressObj) => {
    let logMessage = 'Download speed: ' + progressObj.bytesPerSecond
    logMessage = logMessage + ' - Downloaded ' + progressObj.percent + '%'
    logMessage = logMessage + ' (' + progressObj.transferred + '/' + progressObj.total + ')'
    sendWindowMessage(workerWindow, 'download-progress', logMessage)
  })
  autoUpdater.on('update-downloaded', (info) => {
    sendWindowMessage(workerWindow, 'update-downloaded', 'Update downloaded')
  })
}
initUpdater()
// import '../renderer/store'
// const cpus = require('os').cpus().length
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}
// function enableDevTools(window) {
//   window.webContents.on('did-frame-finish-load', () => {
//     window.webContents.once('devtools-opened', () => {
//       window.focus()
//     })
//     window.webContents.openDevTools()
//   })
// }

let mainWindow, workerWindow
const url = require('url')
function loadWindowURL(renderer, entryURL) {
  if (process.env.NODE_ENV === 'development') {
    renderer.loadURL(entryURL)
  } else {
    const mainpath = url.format({pathname: entryURL, protocol: 'file:', slashes: true})
    renderer.loadURL(mainpath)
  }
}

console.info('renderer env: ', process.env.NODE_ENV)
const winURL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:9080'
  : path.join(__dirname, '/index.html')
function createRendererWindow() {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      webSecurity: false,
      contextIsolation: false,
      additionalArguments: ['renderer']
    },
    backgroundColor: '#222933',
    allowRunningInsecureContent: true,
    height: 763,
    useContentSize: true,
    width: 1200,
    icon: path.join(__dirname, 'static/icon.png'),
    show: false
  })
  const remoteMain = require('@electron/remote/main')
  remoteMain.enable(mainWindow.webContents)
  mainWindow.maximize()
  // mainWindow.onbeforeunload = (e) => {
  //   console.info('onbeforeunload')
  //   return true
  // }
  mainWindow.on('close', () => {
    // config.save()
    console.info('main window close')
    // mainWindow.removeAllListeners('close');
    if (process.env.NODE_ENV !== 'production') {
      mainWindow.webContents.closeDevTools()
    }
    if (process.env.NODE_ENV !== 'test') {
      workerWindow.close()
    }
  })

  mainWindow.on('closed', () => {
    console.info('main window closed')
  })
  // mainWindow.webContents.openDevTools()
  if (process.env.NODE_ENV !== 'production') {
    // enableDevTools(mainWindow)
    mainWindow.webContents.openDevTools()
  }
  loadWindowURL(mainWindow, winURL)
  mainWindow.show()
  // if (process.env.NODE_ENV !== 'development') {
  //   workerWindow.hide()
  // }
}
function createWorkerWindow (bFirst) {
  workerWindow = new BrowserWindow({
    // show: true,
    show: process.env.NODE_ENV !== 'production',
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      contextIsolation: false,
      additionalArguments: ['worker']
    }
  })
  const remoteMain = require('@electron/remote/main')
  remoteMain.enable(workerWindow.webContents)
  workerWindow.on('closed', () => {
    console.log('background window closed')
  })
  let workerURL
  // if (bFirst) {
  //   workerURL = process.env.NODE_ENV === 'development'
  //     ? `guider.html`
  //     : `file://${__dirname}/guider.html`
  // } else {
  workerURL = process.env.NODE_ENV === 'development'
    // ? `http://localhost:9081`
    ? 'worker.html'
    : path.join(__dirname, '/worker.html')
  // }
  if (process.env.NODE_ENV === 'development') workerWindow.loadFile(workerURL)
  else {
    const urlpath = url.format({pathname: workerURL, protocol: 'file:', slashes: true})
    workerWindow.loadURL(urlpath)
  }
  // workerWindow.webContents.openDevTools()
  if (process.env.NODE_ENV !== 'production') {
    workerWindow.webContents.openDevTools()
  }
  workerWindow.show()
}

app.on('window-all-closed', async () => {
  console.info('---------close 2------------')
  // if (process.platform !== 'darwin') {
  app.quit()
  // }
})

app.on('activate', () => {
  if (mainWindow === null) {
    console.info('createWindow()')
  }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})
 */

function sendWindowMessage(targetWindow, message, payload) {
  if (typeof targetWindow === 'undefined') {
    console.log('Target window does not exist')
    return
  }
  targetWindow.webContents.send(message, payload)
}

app.whenReady().then(() => {
  protocol.registerFileProtocol('file', (request, callback) => {
    const pathname = decodeURI(request.url.replace('file:///', ''))
    console.info('file url:', pathname)
    callback(pathname)
  })
  globalShortcut.unregisterAll()
})
app.on('ready', async () => {
  Menu.setApplicationMenu(null)
  require('@electron/remote/main').initialize()
  createWorkerWindow()
  createRendererWindow()
  ipcMain.on('message-from-worker', (event, arg) => {
    // console.info('########################')
    // console.info(arg.type, arg.data)
    sendWindowMessage(mainWindow, 'message-to-renderer', arg)
  })
  ipcMain.on('message-from-renderer', (event, arg) => {
    // console.info('message-to-background: ', event, arg)
    // tasks.push(['message-to-background', event, arg])
    // console.info(workerWindow)
    sendWindowMessage(workerWindow, 'message-from-main', arg)
  })
  ipcMain.on('ready', (event, arg) => {
    console.info('child process ready')
    // mainWindow.show()
  })
  ipcMain.on('export2Diectory', (event, arg) => {
    const { dialog } = require('electron')
    console.info(arg)
    const dir = dialog.showOpenDialogSync(mainWindow, {
      title: '导出文件',
      buttonLabel: '导出',
      properties: ['openDirectory']
    })
    if (!dir) return
    console.info('export:', dir)
    if (!fs.statSync(dir[0]).isDirectory()) return
    // copy files to dir
    const path = require('path')
    for (let filepath of arg) {
      if (fs.existsSync(filepath)) {
        console.info(filepath)
        const f = path.parse(filepath)
        const dest = dir + '/' + f.base
        console.info(dest)
        fs.copyFileSync(filepath, dest)
      }
    }
  })
})
