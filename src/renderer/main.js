import Vue from 'vue'
// import axios from 'axios'

import App from './App'
import router from './router'
import store from './store'
import ElementUI from 'element-ui'
// import 'element-ui/lib/theme-chalk/index.css'
import 'element-theme-dark'
import Service from './components/utils/Service'
import VueLazyload from 'vue-lazyload'
import VueHotkey from 'v-hotkey'
if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
// Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false
Vue.use(ElementUI)
Vue.use(VueHotkey)
Vue.use(VueLazyload, {
  // lazyComponent: true,
  // dispatchEvent: true
})

Vue.prototype.$ipcRenderer = Service.getServiceInstance()

router.afterEach((to, from) => {
  console.info('afterEach, from', from.fullPath, ', to', to.fullPath)
})

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
