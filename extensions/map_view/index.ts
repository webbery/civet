import { window, OverviewItemLoadEvent, IResource, utility } from 'civet'

let mapView = window.createOverview('mapview', 'map layout');

const fs = require('fs')
let frame = ''
fs.readFile(utility.extensionPath + '/map_view/view.html', (err, data)=> {
  if (err) {
    console.error(err)
    return;
  }
  frame = data.toString();
})

mapView.onResourcesLoading((e: OverviewItemLoadEvent) => {
  // mapView.html = frame
  if (e.resources && e.resources.length !== 0) {
    frame = frame.replace('{{resources}}', JSON.stringify(e.resources))
  }
  mapView.html = frame
}, mapView);
