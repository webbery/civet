const _i18n = {
  setting: '配置',
  layout: '布局',
  waterfall: '瀑布',
  path: '路径',
  filename: '文件名',
  size: '大小',
  datetime: '创建时间',
  addtime: '添加时间',
  specs: '尺寸',
  author: '作者',
  tag: '标签',
  anno: '批注',
  keyword: '关键字',
  width: '宽',
  height: '高',
  type: '类型',
  make: '照相机制造商',
  model: '照相机型号',
  xresolution: '水平分辨率',
  yresolution: '垂直分辨率',
  exposuretime: '曝光时间',
  fnumber: '光圈',
  exposureprogram: '拍摄模式',
  isospeedratings: 'ISO速度',
  focallength: '焦距',
  'flash did not fire': '无闪光',
  'compulsory flash mode': '',
  meteringmode: '测光模式',
  spot: '点',
  colorspace: '颜色空间',
  'reading files': '读取图片中',
  'open containing folder': '打开文件所在目录',
  'analysis resource': '分析素材',
  'extension is not exist': '扩展不存在'
}

export function findString(strs: string, target: any) {
  for (const idx of strs) {
    if (strs[idx].indexOf(target) >= 0) return idx
  }
  return -1
}
export function getFormatType(str: string) {
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
}
export function isImage(filename: string) {
  filename = filename.toLowerCase()
  if (filename.indexOf('.jpg') > 0 || filename.indexOf('.bmp') > 0 || filename.indexOf('.png') > 0 ||
    filename.indexOf('.jpeg') > 0 || filename.indexOf('.gif') > 0 || filename.indexOf('.tiff') > 0) {
    return true
  }
  return false
}
export function replaceAll(str: string, s1: any, s2: any) {
  // return str.replace(s1, s2)
  return str.replace(new RegExp(s1, 'gm'), s2)
}
export function joinPath(root: string, path: string) {
  const newPath = root.replace(/\\/g, '/')
  const last = newPath[newPath.length - 1]
  console.info(newPath)
  if (last !== '/') {
    root += '/'
  }
  root += path
  return root
}
export function formatOutput(input: string) {
  if (typeof input !== 'string') return input
  const output = input.replace(/\\/g, '/')
  return output
}
export function isEmpty(val: any) {
  if (!val) return true
  const result = val.replace(/(^\s*)|(\s*$)/g, '')
  if (result === '') return true
  return false
}
export function formatColor16(val: any) {
  let s = parseInt(val).toString(16)
  if (s.length === 1) s = '0' + s
  return s
}
export function locale() {
  return (navigator.languages && navigator.languages.length) ? navigator.languages[0] : navigator.language
}

/**
 * return the english words count in text
 * @param text input text
 */
export function enUSCount(text: string) {
  const original = text.length
  const result = text.replace(/^[0-9a-zA-Z_]{1,}$/ig, '')
  return original - result.length
}

export function i18n(en: string) {
  // const locale = this.locale()
  en = en.toLowerCase()
  if (Object.prototype.hasOwnProperty.call(_i18n, en)) return _i18n[en]
  const words = en.split(' ')
  let str = ''
  console.info('words:', words)
  for (let word of words) {
    if (Object.prototype.hasOwnProperty.call(_i18n, word)) str += _i18n[word]
  }
  if (str.length === 0) return en
  return str
}
