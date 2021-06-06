<template>
  <div
    class="search-item"
    data-item
    data-id="1"
    data-value="1"
    data-custom-properties="null"
    aria-selected="true"
    data-deletable
  >
    {{text}}
    <button
      type="button"
      class="search-button el-icon-close"
      aria-label="Remove item: '1'"
      data-button
    ></button>
  </div>
</template>
<script>

export default {
  name: 'search-item',
  props: {
    text: {
      default: '1',
      type: String
    }
  },
  methods: {}
}
</script>
<style scoped>
.search-item {
  display: inline-block;
  vertical-align: middle;
  border-radius: 20px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 500;
  margin-right: 3.75px;
  margin-bottom: 2px;
  margin-top: 2px;
  background-color: #00bcd4;
  border: 1px solid #00a5bb;
  color: #ffffff;
  word-break: break-all;
  box-sizing: border-box;
  cursor: pointer;
  padding-right: 5px;
}
.search-item .search-button {
  position: relative;
  display: inline-block;
  margin-top: 0;
  margin-right: -4px;
  margin-bottom: 0;
  margin-left: 8px;
  padding-left: 16px;
  border-left: 1px solid #008fa1;
  background-image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjEiIGhlaWdodD0iMjEiIHZpZXdCb3g9IjAgMCAyMSAyMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSIjRkZGIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0yLjU5Mi4wNDRsMTguMzY0IDE4LjM2NC0yLjU0OCAyLjU0OEwuMDQ0IDIuNTkyeiIvPjxwYXRoIGQ9Ik0wIDE4LjM2NEwxOC4zNjQgMGwyLjU0OCAyLjU0OEwyLjU0OCAyMC45MTJ6Ii8+PC9nPjwvc3ZnPg==);
  background-size: 8px;
  width: 8px;
  line-height: 1;
  opacity: 0.75;
  border-radius: 0;
  outline:none;
}
.search-button {
  text-indent: -9999px;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  border: 0;
  background-color: transparent;
  background-repeat: no-repeat;
  background-position: center;
  cursor: pointer;
}
</style>