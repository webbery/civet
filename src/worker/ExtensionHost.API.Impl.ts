import type * as civet from 'civet';
import { PropertyType, ViewType } from '../public/ExtensionHostType'

export interface IExtensionApiFactory {
	(extension: any, registry: any, configProvider: any): typeof civet;
}

export function createApiFactoryAndRegisterActors(): IExtensionApiFactory {
  return function (extension: any, extensionRegistry: any, configProvider: any): typeof civet {
    return {
      version: '1',
      PropertyType: PropertyType,
      ViewType: ViewType,
      activate: null,
      unactivate: null
    }
  }
}
