import { window, OverviewItemLoadEvent, IResource, utility } from 'civet'

let gridview = window.createOverview('gridview', 'waterfall layout');

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
    }
  }
}