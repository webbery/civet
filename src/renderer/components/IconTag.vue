<template>
  <span>
    <i :class="icon"></i>
    <span class="text"><slot></slot></span>
    <button>×</button>
  </span>
</template>
<script>
export default {
  name: 'icon-tag',
  props: {
    icon: { type: String }
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