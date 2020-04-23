<template>
    <div>
        <div>路径: {{picture.realpath}}</div>
        <div>标签:</div>
    </div>
</template>

<script>
import bus from './utils/Bus'

export default {
  name: 'property-panel',
  data() {
    return {
      picture: {realpath: ''}
    }
  },
  mounted() {
    bus.on(bus.EVENT_SELECT_IMAGE, this.displayProperty)
  },
  methods: {
    displayProperty(image) {
      this.picture = image
    }
  }
}
</script>

<style scoped>

</style>