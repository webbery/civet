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
import bus from './utils/Bus'
import Service from './utils/Service'

export default {
  name: 'tag-page',
  data() {
    return {
      tags: []
    }
  },
  mounted() {
    bus.emit(bus.EVENT_UPDATE_NAV_DESCRIBTION, this.$route.query.name)
    this.updateTags()
  },
  methods: {
    async updateTags() {
      const tags = await this.$ipcRenderer.get(Service.GET_ALL_TAGS)
      let tagsInfo = []
      for (let tagIndx in tags) {
        const tag = {
          letter: tagIndx,
          name: tags[tagIndx]
        }
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