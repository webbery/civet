import type * as civet from 'civet';
import * as ExtensionHostType from '../public/ExtensionHostType'
import { RPCProtocal } from './common/RpcProtocal'
import { MessagePipeline } from './MessageTransfer'
import { registSingletonObject, getSingleton } from './Singleton'
import { logger } from '@/../public/Logger'
import { CivetDatabase } from './Kernel'
import { getExtensionPath} from '@/../public/Utility'
import { Resource } from '@/../public/Resource'
import { ExtSearchBar, ExtSearchBarManager } from './view/extHostSearchBar'
import { ExtPropertyView } from './view/extHostPropertyView'
import { ExtOverview, ExtOverviewEntry } from './view/extHostOverview'
import { ExtContentViewEntry } from './view/extHostContentView'
import { ExtMenusEntry } from './contrib/extHostMenus'
import { ExtCommandsEntry } from './contrib/extCommand'

export interface IExtensionApiFactory {
	(extension: any, registry: any, configProvider: any): typeof civet;
}

export function createApiFactoryAndRegisterActors(pipeline: MessagePipeline, extensionName: string): IExtensionApiFactory {
  const rpcProtocal = registSingletonObject(RPCProtocal)
  const extSearchBarManager = registSingletonObject(ExtSearchBarManager)
  const extPropertyView = rpcProtocal.set(ExtPropertyView.name, ExtPropertyView)
  const extOverViewEntry = registSingletonObject(ExtOverviewEntry)
  const extContentViewEntry = registSingletonObject(ExtContentViewEntry)
  const extCommandsEntry = registSingletonObject(ExtCommandsEntry)

  const window: typeof civet.window = {
    get searchBar() { return extSearchBarManager as civet.SearchBar },
  
    get propertyView() { return extPropertyView.propertyView },

    onDidSelectContentItem(listener: (e: civet.ContentItemSelectedEvent) => void, thisArg?: any): void {
      const getResourcesWrapper = function (msg: {id: number[]}): void {
        const item = CivetDatabase.getFilesInfo(msg.id)
        let resource = new Resource(item[0])
        let e = new ExtensionHostType.ExtContentItemSelectedEvent()
        e.items.push(resource)
        listener.call(thisArg, e)
        if (e.items.length === 1) {
          console.info('update seletion property')
          extPropertyView.update()
        } else {
          // select multiple items
        }
      }
      rpcProtocal.regist('getSelectContentItemInfo', getResourcesWrapper, thisArg)
    },

    createOverview(id: string, router: string): civet.OverView {
      return extOverViewEntry.createOverviewEntry(id, router)
    },

    createContentView(id: string, suffixes: string[]): civet.ContentView | null {
      return extContentViewEntry.createContentViewEntry(id, suffixes)
    }
  }

  const commands: typeof civet.commands = {
    registerCommand(command: string, listener: <T>(...args: any[]) => T) {
      extCommandsEntry.regist(command)
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
      commands,
      utility,
      // enum
      PropertyType: ExtensionHostType.PropertyType,
      ViewType: ExtensionHostType.ViewType,
      // function
      activate: null,
      unactivate: null
    }
  }
}
