import { IResource, ResourceProperty, PropertyType } from 'civet'

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

class MetaParser {
  constructor() {}

  parse(filepath: string, file: IResource) {
    console.info('3D model:', filepath)
  }

}

export function activate() {
  const metaParser = new MetaParser()
  return {
    read: (filepath: string, resource: IResource) => {
      metaParser.parse(filepath, resource)
      return true
    }
  }
}