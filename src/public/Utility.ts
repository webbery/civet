import path from 'path'
import sudo from 'sudo-prompt'

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

export async function runCommand(cmd: string, dir: string, auth: boolean = false): Promise<boolean> {
  const curDir = process.cwd()
  process.chdir(dir)
  try {
    let info;
    if (!auth) {
      const { execSync } = require('child_process');
      info = execSync(cmd).toString()
      process.chdir(curDir)
      return true
    } else {
      const f = new Promise(function (resolve, reject) {
        sudo.exec(cmd, {
          name: 'Civet'
        }, function (error: Error|undefined, stdout, stderr) {
          if (error) {
            reject(error)
            return
          }
          resolve(stdout)
        })
      })
      info = await f
    }
    console.info(info)
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
        {
          const process = require('./System').default.proc()
          extensionLocation = 'resources/app.asar.unpacked'
          return path.dirname(process.execPath) + '/' + extensionLocation
        }
      case 'win32':
        extensionLocation = 'resources/app.asar.unpacked'
        return path.resolve('.') + '/' + extensionLocation
      case 'darwin':
        // match electron builder's path
        extensionLocation = 'Resources/app.asar.unpacked'
        return '/Applications/Civet.app/Contents/' + extensionLocation
      default: break
    }
    console.debug('platform:', os.platform())
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

function safeFromCharCode(codes: any) {
  let result = ''
  let chunk = 8 * 1024
  let idx = 0
  for (let len = codes.length / chunk; idx < len; ++idx) {
      result += String.fromCharCode.apply(null, codes.subarray(idx * chunk, (idx + 1) * chunk))
  }
  result += String.fromCharCode.apply(null, codes.subarray(idx * chunk, codes.length - idx * chunk - 1))
  return result
}

export function thumbnail2Base64(thumbnail: any) {
  return 'data:image/png;base64,' + btoa(safeFromCharCode(thumbnail))
}

export function buffer2Base64(buffer: Buffer) {
  buffer.toString('base64')
}

export function text2PNG(text: string, width: number, height: number): string {
  const background = ['rgb(223, 117, 104)', 'rgb(127, 219, 124)', 'rgb(124, 168, 219)', 'rgb(164, 122, 199)', 'rgb(215, 216, 143)']
  const canvas: HTMLCanvasElement = document.getElementById('hidden') as HTMLCanvasElement
  if (!canvas) return ''
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  let index = 0
  for(let idx = 0; idx < text.length; ++idx) {
    index += text.charCodeAt(idx)
  }
  ctx.fillStyle = background[index % 5];
  ctx.fillRect(0, 0, width, height)
  ctx.font = '24px Impact'
  ctx.textAlign = 'center'
  ctx.fillStyle = 'black'
  const y = height / 2 + 5
  ctx.fillText(text, width / 2, y)
  return canvas.toDataURL()
}

export function hasProtocol(url: string) {
  return url.startsWith('//') || url.startsWith('http://') || url.startsWith('https://')
}

export function localKey(key: string) {
  switch (key) {
    case 'Control': return 'CommandOrControl'
    case 'Command': return 'CommandOrControl'
    case 'Alt': return 'Alt'
    case 'Option': return 'Opt'
    default: return key
  }
}