import { BaseService, IBackgroundService } from './ServiceInterface'
import { BaseExtension, ExtensionPackage } from '../ExtensionPackage'
import { showErrorInfo } from 'worker/Singleton';

/**
 * BackgroundService is used to invoke algorithm/others of extensions.
 * So that the result of view could be return to renderer before algorithm/others finish.
 */
export class BackgroundService implements IBackgroundService {

  // registExtension(name: string, extension: ExtensionService) {
  //   // this.#extensions.set(name, extension)
  //   extension.on(name, this.invoke)
  // }

  onBackgroundEvent(): void {
    
  }
}