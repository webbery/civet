<template>
<el-row type="flex">
  <el-col :span="4" class="nav-light">
    <div class="sidenav">
      <span class="el-icon-document" @click="onClickTab(1)"></span>
      <!-- <span class="el-icon-document"></span> -->
      <span class="el-icon-setting dock-bottom" @click="onClickSetting()"></span>
    </div>
  </el-col>
  <el-col :span="20">
      <!-- <div v-for="(tab, indx) in tabs" :key="indx">
        <slot :name="tab.name"></slot>
      </div> -->
      <div class="panel" v-show="tab === 0">
        <slot name="navigation"></slot>
      </div>
  </el-col>
</el-row>
</template>
<script>
export default {
  name: 'tab-menu',
  data() {
    return {
      tabs: [],
      tab: 0
    }
  },
  methods: {
    onClickTab(tabIndx) {},
    onClickSetting() {}
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
height: 100vh;
width: 45px;
display: flex;
flex-direction: column;
z-index: 1;
top: 0;
left: 0;
/* background-color: #111; */
overflow-x: hidden;
padding-top: 20px;
}

.sidenav span, .dropdown-btn {
padding: 6px 8px 6px 16px;
text-decoration: none;
font-size: 20px;
color: #818181;
display: block;
border: none;
background: none;
width:100%;
text-align: left;
cursor: pointer;
outline: none;
}
.sidenav span:hover, .dropdown-btn:hover {
color: #f1f1f1;
}
.dropdown-container {
display: none;
background-color: #262626;
padding-left: 8px;
}
.dock-bottom {
  margin-bottom: 0px;
}
.nav-light{
background-color: rgb(55, 64, 70);
}
</style>