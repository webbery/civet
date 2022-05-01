<template>
    <div class="cv-select" :placeholder="placeholder" ref="resizeable" @change="_adjustSize">
      <input type="text">
      <div
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      >
      </div>
    </div>
</template>
<script>
/**
 * fitted select is a control that display selection in one line
 */
export default {
  name: 'fitted-select',
  props: {
    placeholder: String,
    options: Object
  },
  data() {
    return {
      useMinWidth: true
    }
  },
  mounted() {
    // pass true to make input use its initial width as min-width
    this._addShadow()
  },
  methods: {
    _getElements() {
      // helper method to fetch input and its shadow span
      const input = this.$refs.resizeable.$el.querySelector('.el-input__inner')
      const span = input.previousSibling
      return { input, span }
    },
    _addShadow() {
      // this method adds shadow span to input
      // we'll use this span to calculate text width
      const { input } = this._getElements()
      const span = document.createElement('span')
      span.classList.add('resizeable-shadow')
      input.parentNode.insertBefore(span, input)

      // copy font, padding and border styles from input
      const css = input.computedStyleMap()
      span.style.font = css.get('font')
      span.style.padding = css.get('padding')
      span.style.border = css.get('border')
      if (this.useMinWidth) {
        span.style.minWidth = `${input.getBoundingClientRect().width}px`
      }
    },
    _adjustSize() {
      this.$nextTick(() => {
        const { input, span } = this._getElements()
        span.textContent = input.value
        input.style.width = `${span.getBoundingClientRect().width}px`
      })
    }
  }
}
</script>

<style scoped>
.cv-select {
  display: inline-block;
  -webkit-box-direction: normal;
  position: relative;
  color: rgb(248, 241, 241);
}
.cv-select input {
  height: 28px;
  line-height: 28px;
  -webkit-appearance: none;
  background-color: #222933;
  border-radius: 4px;
  border: 1px solid #121820;
  box-sizing: border-box;
  color: #eee;
  display: inline-block;
  font-size: inherit;
  outline: none;
  width: 100%;
  padding: 0 15px;
}
</style>