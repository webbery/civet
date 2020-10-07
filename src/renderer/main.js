import Vue from 'vue'
// import axios from 'axios'

import App from './App'
import router from './router'
// import store from './store'
import ElementUI from 'element-ui'
// import 'element-ui/lib/theme-chalk/index.css'
import 'element-theme-dark'
import Service from './components/utils/Service'
import Kernel from '../public/Kernel'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
// Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false
Vue.use(ElementUI)

Vue.prototype.$ipcRenderer = Service.getServiceInstance()

Vue.prototype.$kernel = Kernel

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  // store,
  template: '<App/>'
}).$mount('#app')
