import Vue from 'vue'
import axios from 'axios'

import App from './App'
import router from './router'
import store from './store'

import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

const { ipcRenderer } = require('electron')

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false
Vue.use(ElementUI)

let callbackCache = []
Vue.prototype.$ipcRenderer = {
  send: (msgType, msgData) => {
    console.info('message-from-renderer: type=' + msgType + ', data=' + msgData)
    ipcRenderer.send('message-from-renderer', {
      type: msgType,
      data: msgData
    })
  },
  on: (type, callback) => {
    console.info('message-from-main: type=' + type)
    callbackCache.push({
      type,
      callback
    })
  }
}
ipcRenderer.on('message-to-renderer', (sender, msg) => {
  callbackCache.forEach(cache => {
    if (cache.type === msg.type) {
      cache.callback && cache.callback(msg.data)
    }
  })
}) // 监听主进程的消息

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
