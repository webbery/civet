import { injectable, getSingleton } from '../Singleton'
import { MessagePipeline } from '../MessageTransfer'
import { IPCRendererResponse, IPCNormalMessage } from 'public/IPCMessage'

@injectable
export class ExtEnum {

}

@injectable
export class ExtMenusEntry {
  #channel: MessagePipeline;

  constructor(channel: MessagePipeline) {
    this.#channel = channel
    // this.#channel.regist(IPCNormalMessage.GET_OVERVIEW_MENUS, this.replyMenus, this)
  }

  private replyMenus(session: number, id: string) {
    switch(id.toLocaleLowerCase()) {
      case 'overview':
        break
      default: break
    }
  }
}