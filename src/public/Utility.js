export default {
  isObject: function (item) {
    return item != null && typeof item === 'object' && Array.isArray(item) === false
  },
  convert2ValidDate: function (strDate) {
    if (strDate.match(/[0-9]{4}:[0-9]{2}:[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}/g)) {
      // YYYY:MM:DD hh:mm:ss
      const year = strDate.substr(0, 4)
      const month = strDate.substr(5, 2)
      const day = strDate.substr(8, 2)
      return year + '/' + month + '/' + day + strDate.substr(10, 9)
    }
    return strDate
  }
}
