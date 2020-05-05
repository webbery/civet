import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/config',
      name: 'config-page',
      component: require('@/components/ConfigPanel').default
    },
    {
      path: '/viewImage',
      name: 'view-image',
      component: require('@/components/ImagePanel').default
    },
    {
      path: '/tagManager',
      name: 'tag-page',
      component: require('@/components/TagPanel').default
    },
    {
      path: '/',
      component: require('@/components/ViewPanel').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
