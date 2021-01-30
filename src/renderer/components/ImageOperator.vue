<template>
  <div>
    {{filename}}
  </div>
</template>
<script>
import bus from './utils/Bus'

export default {
  name: 'image-operator',
  data() {
    return {
      filename: '_'
    }
  },
  mounted() {
    bus.on(bus.EVENT_DISPLAY_FILE_NAME, this.onUpdateDisplayName)
  },
  methods: {
    onUpdateDisplayName(name) {
      this.filename = name
    }
  }
}
</script>

<style scoped>

</style>