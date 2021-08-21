import { window, OverviewItemLoadEvent, IResource, utility } from 'civet'
import fs from 'fs'
class MapView {
  constructor() {}
}

let mapView = new MapView();

// const fs = require('fs')
let frame = ''
fs.readFile(utility.extensionPath + '/map_view/view.html', (err, data)=> {
  if (err) {
    console.error(err)
    return;
  }
  frame = data.toString();
})

window.overView.onResourcesLoading((e: OverviewItemLoadEvent) => {
  window.overView.html = frame
}, mapView);
