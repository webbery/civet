import type * as civet from 'civet';
import { PropertyType, ViewType, ConditionStyle } from '../public/ExtensionHostType'
import { RPCProtocal } from './common/RpcProtocal'
import { SearchBar, ExtConditionItem, ExtSearchBar } from './view/SearchBar'
import { MessagePipeline } from './MessageTransfer'

export interface IExtensionApiFactory {
	(extension: any, registry: any, configProvider: any): typeof civet;
}

export function createApiFactoryAndRegisterActors(pipeline: MessagePipeline): IExtensionApiFactory {
  const rpcProtocal = new RPCProtocal(pipeline)
  const extSearchBar = new ExtSearchBar(rpcProtocal);

  const window: typeof civet.window = {
    get searchBar() { return extSearchBar.searchBar },
  
    createConditionItem(id: string): civet.ConditionItem {
      return extSearchBar.createConditionItemEntry(id)
    }
  }
  
  return function (extension: any, extensionRegistry: any, configProvider: any): typeof civet {
    return {
      version: '0.0.1',
      // namespace
      window,
      // enum
      PropertyType: PropertyType,
      ViewType: ViewType,
      ConditionStyle: ConditionStyle,
      //
      activate: null,
      unactivate: null
    }
  }
}
