'use strict'

import { app, BrowserWindow, Menu } from 'electron'
import '../renderer/store'

// var handleSquirrelEvent = function() {
//   function executeSquirrelCommand(args, done) {
//     var updateDotExe = path.resolve(path.dirname(process.execPath),'..', 'update.exe');
//     var child = child_process.spawn(updateDotExe, args, { detached: true });
//     child.on('close', function(code) {
//       done();
//     });
//   };
//   function install(done) {
//     var target = path.basename(process.execPath);
//     executeSquirrelCommand(["--createShortcut", target], done);
//   };
//   function uninstall(done) {
//     var target = path.basename(process.execPath);
//     executeSquirrelCommand(["--removeShortcut", target], done);
//   }
//   var squirrelEvent = process.argv[1];
//   switch (squirrelEvent) {
//     case '--squirrel-install':
//       install(app.quit);
//       return true;
//     case '--squirrel-updated':
//       install(app.quit);
//       return true;
//     case '--squirrel-obsolete':
//       app.quit();
//       return true;
//     case '--squirrel-uninstall':
//       uninstall(app.quit);
//       return true;
//   }
//   return false;
// }

// if (handleSquirrelEvent()) {
//   return;
// }
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  Menu.setApplicationMenu(null)
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false
    },
    allowRunningInsecureContent: true,
    height: 563,
    useContentSize: true,
    width: 1000
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
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
