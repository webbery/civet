import Vue from 'vue'
import Vuex from 'vuex'

import modules from './modules'

Vue.use(Vuex)
console.info('111111111111')
export default new Vuex.Store({
  modules,
  strict: process.env.NODE_ENV !== 'production'
})
console.info('22222222222')
