import { window, OverviewItemLoadEvent, IResource, utility } from 'civet'

let gridview = window.createOverview('gridview', 'waterfall layout');

const fs = require('fs')
let frame = ''
let jquery = ''
let waterfall = ''
fs.readFile(utility.extensionPath + '/grid_view/view.html', 'utf-8', (err, data)=> {
  if (err) {
    console.error(err)
    return;
  }
  frame = data.toString();
})

fs.readFile(utility.extensionPath + '/grid_view/jquery.min.js',  (err, data)=> {
  if (err) {
    console.error(err)
    return;
  }
  jquery = data.toString();
})

fs.readFile(utility.extensionPath + '/grid_view/waterfall.min.js',  (err, data)=> {
  if (err) {
    console.error(err)
    return;
  }
  waterfall = data.toString();
})

gridview.onResourcesLoading((e: OverviewItemLoadEvent) => {
  console.info('grid view onResourcesLoading', e.resources.length)
  frame = frame.replace('{{jquery}}', jquery)
  frame = frame.replace('{{waterfall}}', waterfall)
  frame = frame.replace('{{resources}}', JSON.stringify(e.resources))
  console.info('GRID:', frame)
  gridview.html = frame
}, gridview);
