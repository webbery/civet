import { window, OverviewItemLoadEvent, IResource, utility } from 'civet'

let mapView = window.createOverview('mapview', 'map layout');

mapView.onResourcesLoading((e: OverviewItemLoadEvent) => {
  const fs = require('fs')
  let frame = fs.readFileSync(utility.extensionPath + '/map_view/view.html', 'utf-8')
  mapView.html = frame.toString()
}, mapView);
