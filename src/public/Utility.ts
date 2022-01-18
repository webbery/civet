import path from 'path'
const fs = require('fs')

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
  try {
    let child = execSync(cmd).toString()
    console.info(child)
  }catch(error) {
    process.chdir(curDir)
    return false
  }
  process.chdir(curDir)
  return true
}

export function getExtensionPath(): string {
  let extensionLocation = 'extensions'
  if (process.env.NODE_ENV === 'production') {
    const os = require('os')
    switch(os.platform()) {
      case 'linux':
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

export function resetArray<T>(vue: any, array: T[], newVal: T[]) {
  array.splice(0, array.length)
  if (newVal === undefined) {
    return
  }
  for (let idx = 0, len = newVal.length; idx < len; ++idx) {
    vue.$set(array, idx, newVal[idx])
  }
}

export function thumbnail2Base64(thumbnail: any) {
  return 'data:image/jpg;base64,' + btoa(String.fromCharCode.apply(null, thumbnail))
}

export function buffer2Base64(buffer: Buffer) {
  buffer.toString('base64')
}

export function text2PNG(text: string, width: number, height: number): string {
  const background = ['rgb(223, 117, 104)', 'rgb(127, 219, 124)', 'rgb(124, 168, 219)', 'rgb(164, 122, 199)']
  const canvas: HTMLCanvasElement = document.getElementById('hidden') as HTMLCanvasElement
  if (!canvas) return ''
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.fillStyle = background[text.length % 4];
  ctx.fillRect(0, 0, width, height)
  ctx.font = '20px Impact'
  ctx.fillStyle = 'white'
  console.debug('height:', height / 2)
  ctx.fillText(text, (width - text.length * 10) / 2, height / 2 + 5)
  return canvas.toDataURL()
}