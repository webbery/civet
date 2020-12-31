<template>
  <div class="range">
    <span class="label">{{label}}: </span><input :placeholder="firstPlaceholder" />-<input :placeholder="lastPlaceholder" size="mini"/><span>{{unit}}</span>
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
  margin: 5px 15px;
}
input {
  width: 45%;
  -webkit-appearance: none;
  background-color: #222933;
  background-image: none;
  border-radius: 4px;
  border: 1px solid #121820;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  color: #eee;
  display: inline-block;
  font-size: inherit;
  outline: none;
  padding: 0 15px;
  -webkit-transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
  transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
  height: 28px;
  line-height: 28px;
}
input:hover{
  border-color:rgb(247, 249, 250);
}
input:focus{
  border-color:rgb(57, 154, 250);
}
label {
  margin: 25px;
}
</style>