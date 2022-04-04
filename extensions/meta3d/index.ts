import { IResource, ResourceProperty, PropertyType, window, utility } from 'civet'

function convert2ValidDate(str: string): string {
  if (str.match(/[0-9]{4}:[0-9]{2}:[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}/g)) {
    // YYYY:MM:DD hh:mm:ss
    const year = str.substr(0, 4)
    const month = str.substr(5, 2)
    const day = str.substr(8, 2)
    return year + '/' + month + '/' + day + str.substr(10, 9)
  }
  return str
}

let contentView = window.createContentView('3dContentView',
  ['glb', 'gltf']);
contentView.onViewInitialize(():string => {
  const fs = require('fs')
  const html = fs.readFileSync(utility.extensionPath + '/meta3d/content.html', 'utf-8')
  return html
});

class MetaParser {
  constructor() {}

  parse(filepath: string, file: IResource) {
    console.info('3D model:', filepath)
    let prop: ResourceProperty = {
      name: 'thumbnail',
      value: null,
      type: PropertyType.Binary,
      query: false,
      store: false
    }
    let update: ResourceProperty[] = []
    update.push(prop)
    file.putProperty(prop)
    return update
  }

}

export function activate() {
  const metaParser = new MetaParser()
  return {
    read: (filepath: string, resource: IResource) => {
      return metaParser.parse(filepath, resource)
    }
  }
}