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
// Vue.use(ElementUI)
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
