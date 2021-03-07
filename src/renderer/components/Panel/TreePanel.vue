<template>
  <div>
    <div role="tablist" aria-multiselectable="true" class="el-collapse">
      <div :class="['el-collapse-item', classActive]">
        <div role="tab" :aria-expanded="isActive">
          <div role="button" id="el-collapse-head" tabindex="0" :class="['el-collapse-item__header', classActive]" v-on:click="onClick($event)" style="height: 24px; font-size: 14px; font-weight: bold;">
            <i :class="expandArraw"></i>
          分类
              <span role="button" class="icon-add-class dock-right" v-if="isActive" v-on:click="onAddClassify($event)"></span>
          </div>
        </div>
        <div role="tabpanel" aria-labelledby="el-collapse-head-2660" id="el-collapse-content-2660" class="el-collapse-item__wrap" v-if="isActive" data-old-padding-top="" data-old-padding-bottom="" data-old-overflow="" aria-hidden="true">
          <div class="el-collapse-item__content">
            <slot></slot>
            <!-- <slot v-bind:enableEdit="enableEdit"></slot> -->
            <!-- <IconFolder icon="el-icon-folder" enableInput="true" v-if="enableEdit" @onblur="onBlur" :label="newCategoryName"></IconFolder> -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
// import IconFolder from '@/components/Control/IconFolder'
export default {
  name: 'TreePanel',
  // components: { IconFolder },
  data() {
    return {
      enableEdit: false
    }
  },
  props: {
    isActive: {
      type: Boolean,
      default: false
    }
  },
  mounted() {},
  computed: {
    classActive: function() {
      return {
        'is-active': this.isActive
      }
    },
    expandArraw: function() {
      return {
        'el-icon-arrow-down': this.isActive,
        'el-icon-arrow-right': !this.isActive
      }
    }
  },
  methods: {
    onClick(e, self) {
      console.info('el-collapse-head click')
      this.isActive = !this.isActive
    },
    onAddClassify(event) {
      event.stopPropagation()
      this.$emit('addRootClass')
    },
    onBlur(newClass) {
      // this.enableEdit = false
      // if (newClass.trim() === '') return
      // this.$store.dispatch('addClass', [newClass])
      // this.newCategoryName = ''// 同时更新缓存
    }
  }
}
</script>
<style lang="less" rel="stylesheet/less">
@font-face {
  font-family: 'icomoon';
  src: url('../Control/fonts/icomoon.eot?ui1hbx');
  src: url('../Control/fonts/icomoon.eot?ui1hbx#iefix') format('embedded-opentype'),
    url('../Control/fonts/icomoon.ttf?ui1hbx') format('truetype'),
    url('../Control/fonts/icomoon.woff?ui1hbx') format('woff'),
    url('../Control/fonts/icomoon.svg?ui1hbx#icomoon') format('svg');
  font-weight: normal;
  font-style: normal;
}
.dock-right {
  margin: 0 8px 0 auto;
}
.tooltip{
  margin: 4px;
}
.icon-add-class {
  font-family: 'icomoon' !important;
}
.icon-add-class:before {
  content: '\e903';
}
</style>