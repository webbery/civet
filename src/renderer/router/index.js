import Vue from 'vue'
import Router from 'vue-router'

const originalPush = Router.prototype.push
Router.prototype.push = function push(location) {
  return originalPush.call(this, location).catch(err => err)
}

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
      component: require('@/components/Panel/TagPanel').default
    },
    {
      path: '/query',
      component: require('@/components/Panel/ViewPanel').default
    },
    {
      path: '/uncategory',
      component: require('@/components/Panel/ViewPanel').default
    },
    {
      path: '/untag',
      component: require('@/components/Panel/TaglessPanel').default
    },
    {
      path: '/',
      component: require('@/components/Panel/ViewPanel').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
