<template>
  <el-container class="custom">
    <el-header>
      <HeaderBar></HeaderBar>
    </el-header>
    <el-row type="flex" class="row-bg">
      <el-col :span="4">
        <OrganizedPanel></OrganizedPanel>
      </el-col>
      <el-col :span="16">
        <router-view></router-view>
      </el-col>
      <el-col :span="4">
        <PropertyPanel></PropertyPanel>
      </el-col>
    </el-row>
  </el-container>
</template>

<script>
import HeaderBar from '@/components/HeaderBar'
import OrganizedPanel from '@/components/OrganizedPanel'
import ViewPanel from '@/components/ViewPanel'
import PropertyPanel from '@/components/PropertyPanel'
import TagPanel from '@/components/TagPanel'
import ConfigPanel from '@/components/ConfigPanel'

export default {
  name: 'landing-page',
  components: {
    HeaderBar,
    OrganizedPanel,
    ViewPanel,
    PropertyPanel,
    TagPanel,
    ConfigPanel
  },
  mounted() {}
}
</script>

<style scoped>
.el-header {
  display: block;
  background-color: #b3c0d1;
  color: #333;
  height: 30px !important;
}
</style>
