<template>
  <div class="config">
    <div style="margin-top: 15px;">
    <el-input placeholder="请输入内容" v-model="resourcePath" class="input-with-select" :disabled="true">
      <template slot="prepend">资源库路径：</template>
      <el-button slot="append" icon="el-icon-more" @click="onSelectResourcePath()"></el-button>
    </el-input>
  </div>
  <div style="margin-top: 15px;">
    <el-input placeholder="请输入内容" v-model="resourcePath" class="input-with-select" :disabled="true">
      <template slot="prepend">数据库路径：</template>
      <el-button slot="append" icon="el-icon-more" @click="onSelectDBPath()"></el-button>
    </el-input>
  </div>
  </div>
</template>

<script>
export default {
  name: 'config-page',
  data() {
    return {
      resourcePath: '',
      dbpath: ''
    }
  },
  mounted() {
  },
  methods: {
    onSelectResourcePath: () => {
      console.info('select resource Path')
    },
    onSelectDBPath: () => {}
  }
}
</script>

<style scoped>
.config {
  margin: 10%;
}
</style>