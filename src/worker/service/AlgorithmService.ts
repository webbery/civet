import { ExtensionService } from '../ExtensionService'

/**
 * AlgorithmService is used to invoke algorithm of extensions.
 * So that the result of view could be return to renderer before algorithm finish.
 */
export class AlgorithmService {
  // #extensions: Map<string, ExtensionService>;

  constructor() {
  }

  registExtension(name: string, extension: ExtensionService) {
    // this.#extensions.set(name, extension)
    extension.on(name, this.invoke)
  }

  async invoke(options: [ExtensionService, string], ...args: any[]) {
    const extension = options[0]
    const event = options[1]
    const [_, command] = event.split(':')
    await extension.run(command, args)
  }
}