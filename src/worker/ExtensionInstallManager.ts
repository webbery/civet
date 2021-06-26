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

  install(extensionName: string, version: string): boolean {
    const requirements = path.resolve(this._extensionPath, './extensions.txt')
    fs.appendFileSync(requirements, `${extensionName}:${version}\n`)
    logger.debug(`install path: ${requirements}`)
    // here we do not check dependencis conflit
    if(runCommand(`npm install ${extensionName}@${version}`, this._extensionPath))
    {
      return true
    }
    return false
  }

  uninstall(extensionName: string): boolean {
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
    if(runCommand(`npm uninstall ${extensionName}`, this._extensionPath))
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
