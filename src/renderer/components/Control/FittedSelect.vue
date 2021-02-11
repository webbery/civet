<template>
    <el-select v-model="value" :placeholder="placeholder" ref="resizeable" @change="_adjustSize">
      <el-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      ></el-option>
    </el-select>
</template>
<script>
export default {
  name: 'fitted-select',
  props: {
    placeholder: String,
    options: Object
  },
  mounted() {
    // pass true to make input use its initial width as min-width
    this._addShadow();
  },
  methods: {
    _getElements() {
      // helper method to fetch input and its shadow span
      const input = this.$refs.resizeable.$el.querySelector('.el-input__inner');
      const span = input.previousSibling;;
      return { input, span };
    },
    _addShadow() {
      // this method adds shadow span to input
      // we'll use this span to calculate text width
      const { input } = this._getElements();
      const span = document.createElement('span');
      span.classList.add('resizeable-shadow');
      input.parentNode.insertBefore(span, input);

      // copy font, padding and border styles from input
      const css = input.computedStyleMap();
      span.style.font = css.get('font');
      span.style.padding = css.get('padding');
      span.style.border = css.get('border');
      if (useMinWidth) {
        span.style.minWidth = `${input.getBoundingClientRect().width}px`;
      }
    },
    _adjustSize() {
      this.$nextTick(() => {
        const { input, span } = this._getElements();
        span.textContent = input.value;
        input.style.width = `${span.getBoundingClientRect().width}px`;
      });
    }
  }
}
</script>

<style scoped>
span.resizeable-shadow {
  display: inline-block;
  box-sizing: border-box;
  position: absolute;
  left: -99999px;
  top: -99999px;
}
</style>