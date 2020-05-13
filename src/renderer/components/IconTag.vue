<template>
  <span>
    <i :class="iconName"></i>
    <span class="text">{{tagValue}}</span>
    <button>×</button>
  </span>
</template>
<script>
export default {
  name: 'icon-tag',
  data() {
    return {
      tagValue: '这是标签',
      iconName: ''
    }
  }
}
</script>
<style scoped>
span{
  -webkit-user-select: none;
}
button{
  border-radius: 10px;
  border: none;
}
button:hover {
  background-color: rgb(107, 107, 255);
}
</style>