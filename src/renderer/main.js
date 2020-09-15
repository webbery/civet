import Vue from 'vue'
import axios from 'axios'

import App from './App'
import router from './router'
// import store from './store'
import Kernel from '../public/Kernel'

import ElementUI from 'element-ui'
// import 'element-ui/lib/theme-chalk/index.css'
import 'element-theme-dark'

import Service from './components/utils/Service'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false
Vue.use(ElementUI)

Vue.prototype.$ipcRenderer = Service.getServiceInstance()

function initKernel() {
  const userDir = remote.app.getPath('userData')
  const configPath = (remote.app.isPackaged ? userDir + '/cfg.json' : 'cfg.json')
  const config = JSON.parse(fs.readFileSync(configPath))
  if (!Kernel.init(config)) {
    console.error('init kernel fail')
  }
  return kernel
}

const kernel = initKernel()

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  // store,
  kernel,
  template: '<App/>'
}).$mount('#app')
