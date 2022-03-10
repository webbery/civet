import { ExtensionService } from '../ExtensionService'
import { BaseService, IBackgroundService } from './ServiceInterface'
import { BaseExtension } from '../ExtensionPackage'
import { showErrorInfo } from 'worker/Singleton';

/**
 * BackgroundService is used to invoke algorithm/others of extensions.
 * So that the result of view could be return to renderer before algorithm/others finish.
 */
export class BackgroundService extends BaseService implements IBackgroundService {
  #extension: BaseExtension;
  #next: BackgroundService[];

  constructor(extension: BaseExtension) {
    super()
    this.#extension = extension
  }

  get name() { return this.#extension.name; }
  // registExtension(name: string, extension: ExtensionService) {
  //   // this.#extensions.set(name, extension)
  //   extension.on(name, this.invoke)
  // }

  onExtractEvent(): void {
    
  }

  async invoke(options: [ExtensionService, string], ...args: any[]) {
    const extension = options[0]
    const event = options[1]
    const [_, command] = event.split(':')
    // await extension.run(command, args)
    let cmd = this.service[command]
    if (!cmd) {
      const msg = `${command} function not exist`
      showErrorInfo({msg: msg})
      return
    }
    try {
      const result = await cmd(...args)
      // this._pipe.post(ReplyType.WORKER_UPDATE_RESOURCES, [file])
      if (result === undefined) {
        const msg = `extension[${this.#extension.name}] command[${command}] return ${result}`
        return
      }
      for (let service of this.#next) {
        console.info('run next extension', service.name)
        service.emit(service.name + ':' + command, args)
      }
    } catch (err: any) {
      console.error('read error:', err)
      showErrorInfo({filname: args[0], path: args[0], msg: err.message})
    }
  }

  
}