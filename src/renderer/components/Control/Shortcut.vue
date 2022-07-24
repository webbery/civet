<template>
  <div :class="['_cv_basic-shortcut', classFocus]" @keydown="onKeyDown" @keyup="onKeyUp" tabindex="0" @click="onClick" @blur="onBlur">
    <span v-for="(item, k) in currentShortcuts" :key="k">{{item}}</span>
  </div>
</template>
<script>
import Vue from 'vue'
import { localKey } from '@/../public/Utility'

export default {
  data() {
    return {
      currentShortcuts: ['None'],
      index: 0,
      total: 0,
      classFocus: ''
    }
  },
  props: {
    defaultShortcuts: String,
    extension: String
  },
  mounted() {
    if (this.defaultShortcuts.length) {
      const [keys, _] = this.defaultShortcuts.split(',')
      this.currentShortcuts = keys.split(' ')
    }
  },
  methods: {
    isAssistKey(key) {
      return (key === 'Control' || key === 'Shift' || key === 'Alt')
    },
    isCaptal(key) {
      return key === 'CapsLock'
    },
    onKeyDown(event) {
      const key = localKey(event.key)
      if (this.index === 0) {
        this.currentShortcuts.splice(0, this.currentShortcuts.length - 1)
        this.currentShortcuts[this.index] = key
      } else {
        if (this.currentShortcuts.includes(key)) return
        if (this.index === this.currentShortcuts.length) {
          this.currentShortcuts.push(key)
        } else {
          Vue.set(this.currentShortcuts, this.index, key)
        }
      }
      this.index = this.currentShortcuts.length
      console.debug(`keydown[${this.index}]: ${key}`)
    },
    onKeyUp(event) {
      this.index = this.currentShortcuts.length - 1
      const key = localKey(event.key)
      if (key === this.currentShortcuts[0]) {
        this.index = 0
        this.$emit('changed', this.defaultShortcuts, this.currentShortcuts, this.extension)
        this.defaultShortcuts = this.currentShortcuts.join(' ')
      }
      console.debug('press cnt', this.index)
    },
    onClick() {
      this.index = 0
      this.classFocus = '_cv-shortcut-focus'
    },
    onBlur() {
      this.classFocus = ''
    }
  }
}
</script>
<style scoped>
._cv_basic-shortcut {
display: inline;
outline: none;
}
._cv_basic-shortcut span {
  background-color: rgb(79 88 144);
  margin: 3px;
  padding: 2px;
  border-radius: 3px;
}
._cv-shortcut-focus span{
  background-color: rgb(0, 157, 255);
}
</style>
