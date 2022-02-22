import { ExtensionService } from '../ExtensionService'
import { BaseService, IAlgorithmService } from './ServiceInterface'
import { BaseExtension } from '../ExtensionPackage'

/**
 * AlgorithmService is used to invoke algorithm of extensions.
 * So that the result of view could be return to renderer before algorithm finish.
 */
export class AlgorithmService extends BaseService implements IAlgorithmService {
  #extension: BaseExtension;
  #next: AlgorithmService[];

  constructor(extension: BaseExtension) {
    super()
    this.#extension = extension
  }

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
    await extension.run(command, args)
  }

  
}