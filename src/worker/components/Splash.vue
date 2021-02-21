<template>
  <div>
    <div>civet启动! </div>
    <div>{{status}}</div>
  </div>
</template>
<script>
export default {
  name: 'Splash',
  data() {
    return {
      status: ''
    }
  },
  mounted() {
    window.eventBus.$on('status', this.onUpdateStatus)
  },
  methods: {
    onUpdateStatus(status) {
      this.status = status
    }
  }
}
</script>