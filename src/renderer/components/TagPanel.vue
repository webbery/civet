<template>
  <div class="bound">
    <el-scrollbar style="height:96vh;">
    <div v-for="(tag,idx) in tags" :key="idx">
      <div class="letter">{{tag.letter}}</div>
      <div><button  v-for="(name,i) in tag.name" :key="i" border :label="name">{{name}}</button></div>
      <el-divider></el-divider>
    </div>
    </el-scrollbar>
  </div>
</template>

<script>
import localStorage from './utils/localStorage'

export default {
  name: 'tag-page',
  data() {
    return {
      tags: [{
        letter: 'F',
        name: ['风 5', '凤 4']
      },
      {
        letter: 'Q',
        name: ['气象 1', '七秀 2', '棋 3']
      }]
    }
  },
  mounted() {
    this.updateTags()
  },
  methods: {
    async updateTags() {
      const tags = await localStorage.getTags()
      let tagsInfo = []
      for (let tag of tags) {
        tagsInfo.push(tag)
      }
      this.tags = tagsInfo
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