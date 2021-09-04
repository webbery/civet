import { window, OverviewItemLoadEvent, IResource, utility } from 'civet'

let gridview = window.createOverview('gridview', 'waterfall layout');

const fs = require('fs')
let frame = ''
fs.readFile(utility.extensionPath + '/grid_view/view.html', (err, data)=> {
  if (err) {
    console.error(err)
    return;
  }
  frame = data.toString();
})

gridview.onResourcesLoading((e: OverviewItemLoadEvent) => {
  console.info('grid view onResourcesLoading', e.resources.length)
  gridview.html = frame.replace('{{resources}}', JSON.stringify(e.resources))
}, gridview);
