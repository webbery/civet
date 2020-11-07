<template>
  <div class="range">
    <span class="label">{{label}}: </span><input :placeholder="firstPlaceholder" />-<input :placeholder="lastPlaceholder"/><span>{{unit}}</span>
  </div>
</template>
<script>
export default {
  name: 'RangeInput',
  props: {
    label: {
      default: '宽',
      type: String
    },
    firstPlaceholder: {
      default: '',
      type: String
    },
    lastPlaceholder: {
      default: '',
      type: String
    },
    unit: {
      default: 'px',
      type: String
    }
  }
}
</script>
<style scoped>
.range {
  font-size: 12px;
  margin: 5px;
}
input {
  width: 50px;
  background-color: #191e25;
  border: 1px black;
  border-radius: 2px;
  color: white;
  caret-color: white;
}
label {
  margin: 5px;
}
</style>