import { window, OverviewItemLoadEvent, IResource, utility } from 'civet'

let imgContentView = window.createContentView('imgContentView',
  ['jpg', 'jpeg', 'png', 'bmp']);
imgContentView.onViewInitialize(():string => {
  const fs = require('fs')
  const html = fs.readFileSync(utility.extensionPath + '/img_content_view/view.html', 'utf-8')
  return html
});