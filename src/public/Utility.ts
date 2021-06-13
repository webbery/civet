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

export function getAbsolutePath(relativePath: string): string {
  let p = relativePath.replace('/./', '/')
  p = p.replace('//', '/')
  return p
}

export function isFileExist(filepath: string): boolean {
  // let result = path.parse(filepath)
  if (fs.existsSync(filepath)) {
    // let stat = fs.statSync(filepath)
    return true;
  }
  return false;
}

export function runCommand(cmd: string, dir: string): boolean {
  const curDir = process.cwd()
  process.chdir(dir)
  const { execSync } = require('child_process');
  let child = execSync(cmd)
  process.chdir(curDir)
  if (child.error) {
    console.error(child.error)
    return false
  }
  return true
}

export function getExtensionPath(): string {
  let extensionLocation = 'extensions'
  if (process.env.NODE_ENV !== 'development') {
    const os = require('os')
    switch(os.platform()) {
      case 'win32':
        extensionLocation = 'resources/app.asar.unpacked'
        return path.resolve('.') + '/' + extensionLocation
      case 'mac':
        // match electron builder's path
        extensionLocation = 'Resources/app.asar.unpacked'
        return '/Applications/Civet.app/Contents/' + extensionLocation
      default: break
    }
  }
  return path.resolve('.') + '/' + extensionLocation
}
