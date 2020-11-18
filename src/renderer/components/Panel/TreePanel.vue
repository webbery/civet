<template>
  <div>
    <div role="tablist" aria-multiselectable="true" class="el-collapse">
      <div :class="['el-collapse-item', classActive]">
        <div role="tab" :aria-expanded="isActive">
          <div role="button" id="el-collapse-head" tabindex="0" :class="['el-collapse-item__header', classActive]" v-on:click="onClick($event)" style="height: 24px; font-size: 14px; font-weight: bold;">
            <i :class="expandArraw"></i>
          分类
              <i role="button" class="el-icon-circle-plus-outline header-icon dock-right" v-if="isActive" v-on:click="onAddClassify($event)"></i>
          </div>
        </div>
        <div role="tabpanel" aria-labelledby="el-collapse-head-2660" id="el-collapse-content-2660" class="el-collapse-item__wrap" v-if="isActive" data-old-padding-top="" data-old-padding-bottom="" data-old-overflow="" aria-hidden="true">
          <div class="el-collapse-item__content">
            <slot></slot>
            <IconFolder icon="el-icon-folder" enableInput="true" v-if="newClass" @onblur="onBlur" :label="newCategoryName"></IconFolder>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'TreePanel',
  data() {
    return {
      newClass: false,
      newCategoryName: ''
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
      console.info('onAddClassify')
      this.newClass = true
    },
    onBlur() {
      this.newClass = false
      this.newCategoryName = ''
    }
  }
}
</script>
<style>
.dock-right {
  margin: 0 8px 0 auto;
}
.tooltip{
  margin: 4px;
}
</style>