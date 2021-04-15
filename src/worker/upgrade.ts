// 后台升级
const { ipcRenderer } = require('electron')

ipcRenderer.on('checking-for-update', (event, arg) => {
  console.info('checking-for-update, event:', event, arg)
})

ipcRenderer.on('update-available', (event, arg) => {
  console.info('update-available, event:', event, arg)
})

ipcRenderer.on('update-not-available', (event, arg) => {
  console.info('update-not-available, event:', event, arg)
})

ipcRenderer.on('error', (event, arg) => {
  console.info('error, event:', event, arg)
})

ipcRenderer.on('download-progress', (event, arg) => {
  console.info('download-progress, event:', event, arg)
})

ipcRenderer.on('update-downloaded', (event, arg) => {
  console.info('update-downloaded, event:', event, arg)
})
