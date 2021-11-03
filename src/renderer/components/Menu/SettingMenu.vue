<template>
<el-container>
  <div class="sm-container" :style="locationComputed"  v-if="show">
    <ul class="sm-ul">
      <!-- <li>
        <div>{{layout}}<span class="el-icon-arrow-right"></span></div>
      </li> -->
      <li v-for="(layout, index) in layouts" :key="index">
        <div @click="onLayoutClicked(layout.name)"><span class="el-icon-check" v-if="activate===layout.name"></span>{{layout.display}}</div>
      </li>
    </ul>
    <ul class="sm-ul sm-underline"></ul>
    <ul class="sm-ul">
      <li>
        <div @click="onSettingClicked">{{setting}}</div>
      </li>
    </ul>
  </div>
</el-container>
</template>
<script>
import {i18n} from '@/../public/String'
import { IPCRendererResponse, IPCNormalMessage } from '@/../public/IPCMessage'
import { config } from '@/../public/CivetConfig'

export default {
  name: 'setting-menu',
  props: {
    show: false,
    location: {x: 0, y: 0},
    width: 100,
    height: 50
  },
  data() {
    return {
      setting: i18n('setting'),
      layout: i18n('layout'),
      layouts: [],
      activate: ''
    }
  },
  created() {
    this.$ipcRenderer.on(IPCRendererResponse.ON_VIEW_ROUTER_ADD, this.onViewRouterInit)
  },
  mounted() {
    document.addEventListener('click', () => {
      // console.info('click', this.show)
      this.show = false
    }, true)
  },
  computed: {
    locationComputed() {
      return {
        top: this.location.y + 'px',
        left: this.location.x + 'px'
      }
    }
  },
  methods: {
    onSettingClicked() {
      this.$router.push({path: '/config', query: {name: '配置'}})
    },
    onLayoutClicked(name) {
      console.info('select layout', name)
      this.show = false
      this.activate = name
      this.$emit('onDisplayChanged', this.show)
      this.$ipcRenderer.send(IPCNormalMessage.RETRIEVE_OVERVIEW, name)
      config.defaultView = name
      config.save()
    },
    onViewRouterInit(session, routers) {
      console.info('created init:', routers, config.defaultView)
      for (let route of routers) {
        this.layouts.push(route)
      }
      this.activate = config.defaultView
    }
  }
}
</script>
<style scoped>
.sm-container {
  position: fixed;
  user-select: none;
  -ms-user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  z-index: 9999;
  background-color: #222933;
  border: 0 0 1px #121820;
  font-size: 12px;
}
.sm-ul {
  width: 100%;
  padding: 0;
  margin: 0;
  list-style: none;
  /* box-shadow: 0 0 1px #666; */
  /* background-color: #ffffff; */
  /* color: #2e2e2e; */
}
.sm-ul li {
  width: 100%;
  box-sizing: border-box;
  text-align: left;
  position: relative;
  cursor: pointer;
}
.sm-ul li div{
  display: inline-block;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: 0 0.8em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: white;
  position: relative;
}
.sm-ul li div:hover{
  background-color: #666666;
  color: #fff;
}
.sm-underline {
  content: '';
  width: 90%;
  position: absolute;
  left: 5%;
  top: 0;
  height: 1px;
  background-color: #615c5c;
  z-index: 10001;
}

</style>