/*
 * because using custom require, so we can custom our installer
 */
import { isFileExist, getExtensionPath, runCommand } from '@/../public/Utility'
import fs from 'fs'
import path from 'path'
import { logger } from '@/../public/Logger'

export class ExtensionDescriptor {
  name: string;
  version: string;
}

export class ExtensionInstallManager {
  _extensionPath: string;
  constructor(extensionPath: string) {
    this._extensionPath = extensionPath
  }

  private hasAuthority(dir: string) {
    try {
      fs.accessSync(dir, fs.constants.W_OK)
      return true
    } catch (err: any) {
      return false
    }
  }
  async install(extensionName: string, version: string): Promise<boolean> {
    const requirements = path.resolve(this._extensionPath, './extensions.txt')
    let auth = this.hasAuthority(this._extensionPath)
    fs.appendFileSync(requirements, `${extensionName}:${version}\n`)
    logger.debug(`install path: ${requirements}`)
    // here we do not check dependencis conflit
    if(await runCommand(`npm install ${extensionName}@${version}`, this._extensionPath, !auth))
    {
      if (!fs.existsSync(this._extensionPath + '/@civet-extend')) {
        fs.mkdirSync(this._extensionPath + '/@civet-extend')
      }
      const currentPath = this._extensionPath + '/' + extensionName
      if (!fs.existsSync(currentPath)) {
        fs.renameSync(this._extensionPath + '/node_modules/' + extensionName, currentPath)
      }
      return true
    }
    return false
  }

  async uninstall(extensionName: string): Promise<boolean> {
    const requirements = path.resolve(this._extensionPath, './extensions.txt')
    const content = fs.readFileSync(requirements).toString()
    const extensions = content.split('\n')
    let result = ''
    logger.debug(`uninstall: ${extensionName}`)
    for (let item of extensions) {
      if (item.indexOf(extensionName) >= 0 || item.trim().length === 0) continue
      result += item + '\n'
    }
    logger.debug(`uninstall rest content: ${result}`)
    fs.writeFileSync(requirements, result)
    const currentPath = this._extensionPath + '/' + extensionName
    if (fs.existsSync(currentPath)) {
      fs.renameSync(currentPath, this._extensionPath + '/node_modules/' + extensionName)
    }
    let auth = this.hasAuthority(this._extensionPath)
    if(await runCommand(`npm uninstall ${extensionName}`, this._extensionPath, !auth))
    {
      return true
    }
    return false
  }

  update(extensionName: string) {}

  installList(): ExtensionDescriptor[] {
    const requirements = path.resolve(this._extensionPath, './extensions.txt')
    const content = fs.readFileSync(requirements).toString()
    const extensions = content.split('\n')
    let exts: ExtensionDescriptor[] = []
    for (let extension of extensions) {
      const [name, version] = extension.split(':')
      if (name === "") continue
      const desc = new ExtensionDescriptor()
      desc.name = name
      desc.version = version
      exts.push(desc)
    }
    return exts
  }
}
