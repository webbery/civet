<template>
  <el-container>
    <el-header><HeaderBar></HeaderBar></el-header>
    <el-row type="flex" class="row-bg">
  <el-col :span="4"><OrganizedPanel></OrganizedPanel></el-col>
  <el-col :span="16"><ViewPanel></ViewPanel></el-col>
  <el-col :span="4"><div class="grid-content bg-purple property-panel">Property</div></el-col>
</el-row>
  </el-container>
</template>

<script>
import HeaderBar from '@/components/HeaderBar'
import OrganizedPanel from '@/components/OrganizedPanel'
import ViewPanel from '@/components/ViewPanel'

export default {
  name: 'landing-page',
  components: {
    HeaderBar, OrganizedPanel, ViewPanel
  },
  mounted() {}
}
</script>

<style scoped>
.el-header {
  display: block;
  background-color: #b3c0d1;
  color: #333;
}

.container-panel {
  background-color: #d3dce6;
  color: #333;
  text-align: center;
  line-height: 200px;
}

.property-panel{
  background-color: #d3dce6;
  color: #333;
  text-align: center;
  line-height: 200px;
}

.main-view {
  background-color: #e9eef3;
  color: #333;
  text-align: center;
  line-height: 160px;
}
</style>
