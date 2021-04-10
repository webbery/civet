// import CV from '../public/CV'
// import { JImage } from './Image'
// import { CategoryArray } from './Category'
import ElementUI from 'element-ui'
import 'element-theme-dark'
import Vue from 'vue'
import App from './App'
import { serviceHub } from './ServiceHub'

serviceHub.registObserver()

// 尽早打开主窗口
const { ipcRenderer } = require('electron')

// ready()
if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = false
Vue.use(ElementUI)
Vue.prototype.$ipcRenderer = ipcRenderer
window['eventBus'] = new Vue()

/* splash */
new Vue({
  components: { App },
  template: '<App/>'
}).$mount('#app')

Array.prototype.remove = function (val) {
  const index = this.indexOf(val)
  if (index > -1) {
    this.splice(index, 1)
  }
}

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
