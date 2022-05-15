import { window, utility, SelectionChangedEvent } from 'civet'

const eventProcess = {
  '今日': function () {
    const today = new Date(new Date().toLocaleDateString())
    const query = {$gt: today}
    return query
  },
  '昨日': function () {
    const today = new Date(new Date().toLocaleDateString())
    let yesterday = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000)
    yesterday.setHours(0, 0, 0, 0)
    return yesterday
  },
  '最近7日': function () {
    const today = new Date(new Date().toLocaleDateString())
    let near7 = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    near7.setHours(0, 0, 0, 0)
    return near7
  },
  '最近30日': function () {
    const today = new Date(new Date().toLocaleDateString())
    let near30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    near30.setHours(0, 0, 0, 0)
    return near30
  },
  '最近90日': function () {
    const today = new Date(new Date().toLocaleDateString())
    let near90 = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
    near90.setHours(0, 0, 0, 0)
    return near90
  },
  '最近365日': function () {
    const today = new Date(new Date().toLocaleDateString())
    let near365 = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)
    near365.setHours(0, 0, 0, 0)
    return near365
  }
}

const contentType2SearchType  = {
  'img/jpeg': 'jpg',
  'jpg': 'jpg',
  'jpeg': 'jpg',
  'bmp': 'bmp',
  'tif': 'tif',
  'tiff': 'tif',
  'png': 'png',
  'glb': 'glb',
  'gltf': 'gltf',
  'gif': 'gif'
}

function selectChangedListener(e: SelectionChangedEvent): Object | string[] | string {
  let newQuery = []
  for (const key of e.values) {
    newQuery = eventProcess[key]()
  }
  return newQuery
}

function selectColorListener(e: SelectionChangedEvent): Object | string[] | string {
  let newQuery = {}
  for (const key of e.values) {
    if (!key) {
      return '*'
    }
    newQuery = {$near: key}
  }
  return newQuery
}

export function activate() {
  const colorSelector = window.searchBar.createColorSelector()
  colorSelector.onSelectionChanged(selectColorListener)
  window.searchBar.addSelector(colorSelector)
  const enumSelector = window.searchBar.createEnumSelector('type', '类型', true)
  const supports = utility.getSupportContentType()
  let type = new Set()
  for (const t of supports) {
    type.add(contentType2SearchType[t])
  }
  console.debug('support content types:', type)
  enumSelector.addEnumeration(Array.from(type) as string[])
  window.searchBar.addSelector(enumSelector)
  const timeSelector = window.searchBar.createEnumSelector('datetime', '时间', false)
  timeSelector.addEnumeration(['今日', '昨日', '最近7日', '最近30日', '最近90日', '最近365日'])
  timeSelector.onSelectionChanged(selectChangedListener)
  window.searchBar.addSelector(timeSelector)
}
