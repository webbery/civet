import type * as civet from 'civet';
import { PropertyType, ViewType } from '../public/ExtensionHostType'
import { RPCProtocal } from './common/RpcProtocal'
import { MessagePipeline } from './MessageTransfer'
import { registSingletonObject, getSingleton } from './Singleton'
import { logger } from '@/../public/Logger'
import { ExtSearchBar } from './view/extHostSearchBar'
import { ExtPropertyView } from './view/extHostPropertyView'

export interface IExtensionApiFactory {
	(extension: any, registry: any, configProvider: any): typeof civet;
}

export function createApiFactoryAndRegisterActors(pipeline: MessagePipeline): IExtensionApiFactory {
  registSingletonObject(RPCProtocal)
  const extSearchBar = registSingletonObject(ExtSearchBar)
  const extPropertyView = registSingletonObject(ExtPropertyView)

  const window: typeof civet.window = {
    get searchBar() { return extSearchBar.searchBar },
  
    createConditionItem(id: string): civet.ConditionItem {
      logger.debug(`${id} create entry ${extSearchBar.proxy}`)
      return extSearchBar.createConditionItemEntry(id)
    },

    get propertyView() { return extPropertyView.propertyView }
  }
  
  return function (extension: any, extensionRegistry: any, configProvider: any): typeof civet {
    return {
      version: '0.0.1',
      // namespace
      window,
      // enum
      PropertyType: PropertyType,
      ViewType: ViewType,
      //
      activate: null,
      unactivate: null
    }
  }
}
