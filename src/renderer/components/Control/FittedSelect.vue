<template>
    <div class="cv-select" :placeholder="attributes.placeholder" ref="resizeable" @change="_adjustSize">
      <input type="text" readonly class="cv-input_inner" @click="onClick">
      <span><i :class="defaultArraw"></i></span>
      <div
        v-for="item in attributes.options"
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
    attributes: Object
  },
  data() {
    return {
      useMinWidth: true,
      defaultArraw: 'cv-caret-down'
    }
  },
  mounted() {
    // pass true to make input use its initial width as min-width
    // this._addShadow()
  },
  methods: {
    _getElements() {
      // helper method to fetch input and its shadow span
      const input = this.$refs.resizeable.$el.querySelector('.cv-input__inner')
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
        // const { input, span } = this._getElements()
        // span.textContent = input.value
        // input.style.width = `${span.getBoundingClientRect().width}px`
      })
    },
    onClick() {
      if (this.defaultArraw === 'cv-caret-down') { // default arraw down
        this.defaultArraw += ' rotate-up'
      } else {
        this.defaultArraw = this.defaultArraw.replace(' rotate-up', '')
      }
    }
  }
}
</script>

<style scoped>
@import url('../../../../static/css/all.min.css');

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
  padding: 0 15px;
  cursor: pointer;
}
.cv-select input:hover {
  border-color: #eee;
}
.cv-select input:focus {
  border-color: #00adff;
}
.cv-select span {
  position: absolute;
  right: 5px;
  pointer-events: none;
}
.cv-input_inner {
  padding-right: 30px;
  width: 100%;
  pointer-events: all;
  transition: border-color .2s cubic-bezier(.645, .045, .355, 1);
}
.cv-caret-down {
  display: inline-block;
  line-height: 20px;
  height: 28px;
  text-align: center;
  transform: rotate(0deg);
  transition: transform 0.2s;
}
.cv-caret-down::before {
  content: '\f078';
  display: flex;
  height: 100%;
  align-items: center;
  font-family: 'FontAwesome';
  font-style: normal;
  font-weight: normal;
  cursor: pointer;
  color: #eee;
}
.rotate-up {
  transform: rotate(-180deg);
  transition: transform 0.2s;
}
</style>