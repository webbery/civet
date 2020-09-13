'use strict'

import { app, BrowserWindow, Menu, ipcMain } from 'electron'
import '../renderer/store'
// const cpus = require('os').cpus().length
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow, workerWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`
const workerURL = process.env.NODE_ENV === 'development'
  // ? `http://localhost:9081`
  ? `worker.html`
  : `file://${__dirname}/worker.html`
function createWindow () {
  console.info('====================')
  Menu.setApplicationMenu(null)
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      webSecurity: false
    },
    allowRunningInsecureContent: true,
    height: 563,
    useContentSize: true,
    width: 1000,
    show: false
  })

  mainWindow.maximize()
  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    console.info('---------close------------')
    workerWindow.close()
    mainWindow = null
  })

  workerWindow = new BrowserWindow({
    show: process.env.NODE_ENV === 'development',
    webPreferences: { nodeIntegration: true }
  })
  workerWindow.on('closed', () => {
    console.log('background window closed')
  })
  if (process.env.NODE_ENV === 'development') workerWindow.loadFile(workerURL)
  else workerWindow.loadURL(workerURL)
  // mainWindow.openDevTools()
  // workerWindow.openDevTools()
  mainWindow.show()
}

app.on('window-all-closed', async () => {
  console.info('---------close 2------------')
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// let childDirectoryWindow
// ipcMain.on('import-directory', () => {
//   console.info('-------------')
//   childDirectoryWindow = new BrowserWindow({
//     parent: mainWindow,
//     modal: true,
//     show: false,
//     width: 300,
//     height: 300,
//     resizable: false,
//     backgroundColor: '#fff',
//     frame: false,
//     hasShadow: true,
//     closable: true,
//     webPreferences: {
//       devTools: false
//     }
//   })
//   childDirectoryWindow.once('ready-to-show', () => {
//     childDirectoryWindow.show()
//   })
//   childDirectoryWindow.loadURL(winURL + '#/downloadModal')
// })
// // 关闭模态窗口
// ipcMain.on('close-down-modal', () => {
//   childDirectoryWindow.hide()
// })
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

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */

function sendWindowMessage(targetWindow, message, payload) {
  if (typeof targetWindow === 'undefined') {
    console.log('Target window does not exist')
    return
  }
  targetWindow.webContents.send(message, payload)
}

app.on('ready', async () => {
  console.info('====================')

  // 检查配置数据是否存在
  const userDir = app.getPath('userData')
  const cfgFile = (app.isPackaged ? userDir + '/cfg.json' : 'cfg.json')
  const fs = require('fs')
  let cfg = {
    db: {
      path: userDir + '/civet'
    },
    resource: {
      path: userDir + '/resource'
    },
    app: {
      first: true
    }
  }
  console.info('cfgFile', cfgFile)
  if (!fs.existsSync(cfgFile)) {
    fs.writeFileSync(cfgFile, JSON.stringify(cfg))
  }

  createWindow()
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
    // available.push(event.sender)
    // doIt()
  })
})
