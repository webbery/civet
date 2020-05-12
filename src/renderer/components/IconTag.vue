<template>
  <span>
    <span class="text">{{tagValue}}</span>
    <button>x</button>
  </span>
</template>
<script>
export default {
  name: 'icon-tag',
  data() {
    return {
      tagValue: '这是标签'
    }
  }
}
</script>
<style scoped>
span{
  -webkit-user-select: none;
}
</style>