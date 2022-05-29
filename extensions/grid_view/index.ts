import { window, OverviewItemLoadEvent, IResource, utility } from 'civet'

const i18n = {
  'zh-CN': {
    'waterfall layout': '瀑布流布局'
  },
  'en': {
    'waterfall layout': 'waterfall layout'
  },
  'en_US': {
    'waterfall layout': 'waterfall layout'
  }
}
let gridview = window.createOverview('gridview', i18n[navigator.language]['waterfall layout']);

const fs = require('fs')

gridview.onResourcesLoading((e: OverviewItemLoadEvent) => {
  console.info('grid view onResourcesLoading', e.resources.length)
  let frame = fs.readFileSync(utility.extensionPath + '/grid_view/view.html', 'utf-8')
  gridview.html = frame.toString()
}, gridview);

export function activate() {
  return {
    'deleteResources': function (args: any) {
      console.info('deleteResources:', args)
    },
    'i18n': () => {
      return {
        'waterfall layout': ''
      }
    }
  }
}