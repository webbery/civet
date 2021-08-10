import type * as civet from 'civet';
import { PropertyType, ViewType, ExtContentItemSelectedEvent } from '../public/ExtensionHostType'
import { RPCProtocal } from './common/RpcProtocal'
import { MessagePipeline } from './MessageTransfer'
import { registSingletonObject, getSingleton } from './Singleton'
import { logger } from '@/../public/Logger'
import { ExtSearchBar } from './view/extHostSearchBar'
import { ExtPropertyView, PropertyView } from './view/extHostPropertyView'
import { CivetDatabase } from './Kernel'
import { getExtensionPath} from '@/../public/Utility'
import { Resource } from '@/../public/Resource'

export interface IExtensionApiFactory {
	(extension: any, registry: any, configProvider: any): typeof civet;
}

export function createApiFactoryAndRegisterActors(pipeline: MessagePipeline): IExtensionApiFactory {
  const rpcProtocal = registSingletonObject(RPCProtocal)
  const extSearchBar = registSingletonObject(ExtSearchBar)
  const extPropertyView = rpcProtocal.set(ExtPropertyView.name, ExtPropertyView)

  const window: typeof civet.window = {
    get searchBar() { return extSearchBar.searchBar },
  
    createConditionItem(id: string): civet.ConditionItem {
      logger.debug(`${id} create entry ${extSearchBar.proxy}`)
      return extSearchBar.createConditionItemEntry(id)
    },

    get propertyView() { return extPropertyView.propertyView },

    onDidSelectContentItem(listener: (e: civet.ContentItemSelectedEvent) => void, thisArg?: any): void {
      const getResourcesWrapper = function (msg: {id: number[]}): void {
        const item = CivetDatabase.getFilesInfo(msg.id)
        let resource = new Resource(item[0])
        let e = new ExtContentItemSelectedEvent()
        e.items.push(resource)
        listener(e)
      }
      rpcProtocal.regist('getSelectContentItemInfo', getResourcesWrapper, thisArg)
    }
  }

  const utility: typeof civet.utility = {
    extensionPath: getExtensionPath(),
    getClasses(): string[] {
      const allClasses = CivetDatabase.getClasses('/')
      return allClasses
    },
    getTags(): string[] {
      const allTags = CivetDatabase.getAllTags()
      return allTags
    }
  }
  
  return function (extension: any, extensionRegistry: any, configProvider: any): typeof civet {
    return {
      version: '0.0.1',
      // namespace
      window,
      utility,
      // enum
      PropertyType: PropertyType,
      ViewType: ViewType,
      // function
      activate: null,
      unactivate: null
    }
  }
}
