import Vue from 'vue'
// import axios from 'axios'

import App from './App'
import router from './router'
import store from './store'
import ElementUI from 'element-ui'
// import 'element-ui/lib/theme-chalk/index.css'
import 'element-theme-dark'
// import Service from './components/utils/Service'
import { service } from './common/RendererService'
import VueLazyload from 'vue-lazyload'
import VueHotkey from 'v-hotkey'
import upperFirst from 'lodash/upperFirst'
import camelCase from 'lodash/camelCase'
if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
// Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false
Vue.use(ElementUI)
Vue.use(VueHotkey)
Vue.use(VueLazyload, {
  // lazyComponent: true,
  // dispatchEvent: true
})

Vue.prototype.$ipcRenderer = service
// Vue.prototype.$ipcRenderer = Service.getServiceInstance()

router.afterEach((to, from) => {
  console.info('afterEach, from', from.fullPath, ', to', to.fullPath)
})

const requireComponent = require.context(
  // 其组件目录的相对路径
  './components/Control',
  // 是否查询其子目录
  false,
  // 匹配基础组件文件名的正则表达式
  /CV[A-Z]\w+\.(vue|js)$/
)

requireComponent.keys().forEach(fileName => {
  // 获取组件配置
  const componentConfig = requireComponent(fileName)

  // 获取组件的 PascalCase 命名
  const componentName = upperFirst(
    camelCase(
      // 获取和目录深度无关的文件名
      fileName
        .split('/')
        .pop()
        .replace(/\.\w+$/, '')
    )
  )
  // 全局注册组件
  Vue.component(
    componentName,
    // 如果这个组件选项是通过 `export default` 导出的，
    // 那么就会优先使用 `.default`，
    // 否则回退到使用模块的根。
    componentConfig.default || componentConfig
  )
})

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')

/* exported civet API */
function acquireCivetApi() {
  return {
    postMessage: service.send
  }
}
