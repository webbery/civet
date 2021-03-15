<template>
  <div class="bound">
    <el-scrollbar style="height:96vh;">
    <div v-for="(aTags, letter) in tags" :key="letter">
      <div class="letter">{{letter}}</div>
      <div><button  v-for="(tag, i) in aTags" :key="i" border :label="tag.name">{{tag.name + ' ' + tag.files.length}}</button></div>
      <el-divider></el-divider>
    </div>
    </el-scrollbar>
  </div>
</template>

<script>
export default {
  name: 'tag-page',
  data() {
    return {
      tags: []
    }
  },
  mounted() {
    this.updateTags()
  },
  methods: {
    updateTags() {
      this.tags = this.$store.getters.tags
      console.info(this.tags)
    }
  }
}
</script>

<style scoped>
.bound{
  margin: 30px;
}
.letter{
  font-weight: bold;
  font-family: "lucida grande", "lucida sans unicode", lucida, helvetica,
    "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif;
  font-size: 18px;
}
.tag{
  font-family: "lucida grande", "lucida sans unicode", lucida, helvetica,
    "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif;
  font-size: 16px;
}
button {
  z-index: 100;
  min-width: 60px;
  height: 30px;
  background: #d0d8ea;
  background: #343e58;
  background: #3f4865;
  border: none;
  border-radius: 20px;
  text-transform: uppercase;
  color: black;
  font-weight: 500;
  -webkit-transition: all 0.2s;
  transition: all 0.2s;
  margin: 10px;
  outline: none;
}
button:focus {
  z-index: 100;
  min-width: 60px;
  height: 30px;
  background: #5581ff;
  border: none;
  border-radius: 20px;
  text-transform: uppercase;
  color: white;
  font-weight: 500;
  -webkit-transition: all 0.2s;
  transition: all 0.2s;
  margin: 10px;
  outline: none;
}
</style>