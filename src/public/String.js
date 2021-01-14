export default {
  findString: (strs, target) => {
    for (let idx of strs) {
      if (strs[idx].indexOf(target) >= 0) return idx
    }
    return -1
  },
  getFormatType: (str) => {
    const start = str.indexOf('/')
    if (start > 0) { // such as: image/jpg
      const name = str.substring(start + 1)
      return name
    } else { // file:
      const pos = str.lastIndexOf('.')
      if (pos === -1) return 'unknow'
      const name = str.substring(pos + 1)
      return name
    }
  },
  isImage: (filename) => {
    filename = filename.toLowerCase()
    if (filename.indexOf('.jpg') > 0 || filename.indexOf('.bmp') > 0 || filename.indexOf('.png') > 0 ||
      filename.indexOf('.jpeg') > 0 || filename.indexOf('.gif') > 0 || filename.indexOf('.tiff') > 0) {
      return true
    }
    return false
  },
  replaceAll: (str, s1, s2) => {
    // return str.replace(s1, s2)
    return str.replace(new RegExp(s1, 'gm'), s2)
  },
  joinPath: (root, path) => {
    let newPath = root.replace(/\\/g, '/')
    let last = newPath[newPath.length - 1]
    console.info(newPath)
    if (last !== '/') {
      root += '/'
    }
    root += path
    return root
  },
  isEmpty: (val) => {
    if (!val) return true
    const result = val.replace(/(^\s*)|(\s*$)/g, '')
    if (result === '') return true
    return false
  },
  formatColor16: (val) => {
    let s = parseInt(val).toString(16)
    if (s.length === 1) s = '0' + s
    return s
  },
  i18n: (en) => {
    switch (en) {
      case 'path': return '路径'
      case 'filename': return '文件名'
      case 'size': return '大小'
      case 'createtime': return '创建时间'
      case 'specs': return '尺寸'
      case 'author': return '作者'
      case 'tag': return '标签'
      case 'anno': return '批注'
      case 'keyword': return '关键字'
      case 'width': return '宽'
      case 'height': return '高'
      case 'type': return '类型'
      default: return en
    }
  }
}
