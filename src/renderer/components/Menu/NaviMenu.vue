<template>
<el-row type="flex">
  <el-col :span="4" class="nav-light">
    <div class="sidenav">
      <span class="el-icon-document" :class="{'nav-active': tab === 0, 'nav-deactive': tab !== 0}" @click="onClickTab(0)"></span>
      <span class="el-icon-menu" :class="{'nav-active': tab === 1, 'nav-deactive': tab !== 1}"  @click="onClickTab(1)"></span>
      <span ref="setting" class="el-icon-setting dock-bottom" @click="onClickSetting()"></span>
    </div>
  </el-col>
  <el-col :span="20">
      <!-- <div v-for="(tab, indx) in tabs" :key="indx">
        <slot :name="tab.name"></slot>
      </div> -->
      <div class="_cv_panel" v-if="tab === 0">
        <slot name="navigation"></slot>
      </div>
      <div class="_cv_panel" v-if="tab === 1">
        <slot name="extension"></slot>
      </div>
  </el-col>
  <SettingMenu :show="displayMenu" :location="location" @onDisplayChanged="onDisplayChanged"></SettingMenu>
</el-row>
</template>
<script>
import SettingMenu from './SettingMenu'

export default {
  name: 'tab-menu',
  components: { SettingMenu },
  data() {
    return {
      tabs: [],
      tab: 0,
      displayMenu: false,
      location: {x: 100, y: 200}
    }
  },
  methods: {
    onClickTab(tabIndx) {
      this.tab = tabIndx
    },
    onClickSetting() {
      const rect = this.$refs.setting.getBoundingClientRect()
      this.location.x = rect.left + (rect.right - rect.left) / 2
      this.location.y = rect.top - 2 * 40
      console.info('bottom', this.location.y, rect.bottom, rect.top, this.displayMenu)
      this.displayMenu = !this.displayMenu
    },
    onDisplayChanged(value) {
      this.displayMenu = value
    }
  }
}
</script>
<style scoped>
/* .organize{
height: 100%;
width: 100%;
background-color: #111;
} */
.sidenav {
height: 94vh;
display: flex;
flex-direction: column;
z-index: 1;
top: 0;
left: 0;
bottom:0px;
overflow-x: hidden;
padding-top: 20px;
}

.sidenav span, .dropdown-btn {
padding: 6px;
text-decoration: none;
font-size: 24px;
display: block;
border: none;
background: none;
cursor: pointer;
outline: none;
text-align: center;
}
.sidenav span:hover, .dropdown-btn:hover {
color: #f1f1f1;
}
.nav-active {
color: #f1f1f1;
}
.nav-deactive {
color: #818181;
}
.dropdown-container {
display: none;
background-color: #262626;
padding-left: 8px;
}
.dock-bottom {
  margin-bottom: 0px;
  margin-top: auto;
}
.nav-light{
background-color: hsl(215, 20%, 24%);
}
</style>