export default {
  isObject: function (item) {
    return item != null && typeof item === 'object' && Array.isArray(item) === false
  }
}
