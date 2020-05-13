<template>
  <span>
    <i :class="iconName"></i>
    <span class="text">{{tagValue}}</span>
  </span>
</template>
<script>
export default {
  name: 'icon-folder',
  data() {
    return {
      tagValue: '文件夹',
      iconName: ''
    }
  }
}
</script>
<style scoped>
span{
  -webkit-user-select: none;
}
</style>