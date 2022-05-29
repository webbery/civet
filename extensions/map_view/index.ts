import { window, OverviewItemLoadEvent, IResource, utility } from 'civet'

const i18n = {
  'zh-CN': {
    'map layout': '地图布局'
  },
  'en': {
    'map layout': 'map layout'
  },
  'en_US': {
    'map layout': 'map layout'
  }
}
let mapView = window.createOverview('mapview', i18n[navigator.language]['map layout']);

mapView.onResourcesLoading((e: OverviewItemLoadEvent) => {
  const fs = require('fs')
  let frame = fs.readFileSync(utility.extensionPath + '/map_view/view.html', 'utf-8')
  mapView.html = frame.toString()
}, mapView);

export function activate() {
  return {
    'i18n': () => {
      return {
        'map layout': '地图布局'
      }
    }
  }
}