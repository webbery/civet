import fs from 'fs'
import path from 'path'

export function convert2ValidDate(str: string): string {
  if (str.match(/[0-9]{4}:[0-9]{2}:[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}/g)) {
    // YYYY:MM:DD hh:mm:ss
    const year = str.substr(0, 4)
    const month = str.substr(5, 2)
    const day = str.substr(8, 2)
    return year + '/' + month + '/' + day + str.substr(10, 9)
  }
  return str
}

export function getSuffixFromString(str: string): string {
  // file:
  const pos = str.lastIndexOf('.')
  if (pos === -1) return '-'
  let name = str.substring(pos + 1).toLocaleLowerCase()
  if (name === 'jpeg') name = 'jpg'
  else if (name === 'tiff') name = 'tif'
  return name
}

export function isEmpty(str: string): boolean {
  if (!str || str.trim().length === 0) return true
  return false
}

function mkdir(dirname: string): boolean {
  if (fs.existsSync(dirname)) return true;
  const parent = path.dirname(dirname)
  if (!mkdir(parent)) {
    fs.mkdirSync(parent)
    return true;
  }
  return false
}

export function createDirectories(str: string): boolean {
  return mkdir(str);
}