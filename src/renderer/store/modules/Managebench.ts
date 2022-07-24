import { ViewType } from '../../../public/ExtensionHostType'
/**
 * A class that describe focus element
 */
class FocusableElement {
  id: string;
  type: ViewType;
  instance: any;
}

/**
 * This class contain extension's name and its instance id in renderer.
 * And record which panel is focus or active
 */
class ManagebenchImpl {
  #extensions: Map<string, string>

  constructor() {
    console.debug('ManagebenchImpl')
    this.#extensions = new Map
  }
  /**
   * get extension's name with instance id
   * @param id instance id
   */
  getExtensionName(id: string) {
    return this.#extensions[id]
  }

  bindExtension(id: string, extension: string) {
    console.debug('bind extension:', id, extension)
    this.#extensions[id] = extension
  }

}

export const Managebench = new ManagebenchImpl