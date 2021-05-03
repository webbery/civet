// 后台升级
const { ipcRenderer } = require('electron')

ipcRenderer.on('checking-for-update', (event: any, arg: any) => {
  console.info('checking-for-update, event:', event, arg)
})

ipcRenderer.on('update-available', (event: any, arg: any) => {
  console.info('update-available, event:', event, arg)
})

ipcRenderer.on('update-not-available', (event: any, arg: any) => {
  console.info('update-not-available, event:', event, arg)
})

ipcRenderer.on('error', (event: any, arg: any) => {
  console.info('error, event:', event, arg)
})

ipcRenderer.on('download-progress', (event: any, arg: any) => {
  console.info('download-progress, event:', event, arg)
})

ipcRenderer.on('update-downloaded', (event: any, arg: any) => {
  console.info('update-downloaded, event:', event, arg)
})
