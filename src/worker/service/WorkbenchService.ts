import { MessagePipeline } from '../MessageTransfer'
import { ReplyType, Message } from '../Message'
import { WorkbenchObserver } from './WorkbenchObserver'

export class WorkbenchService {
  constructor(pipeline: MessagePipeline, observer: WorkbenchObserver) {
    this.observer = observer;
    pipeline.regist('getWorkbenchView', this.initWorkbenchFromExtension, this)
  }

  initWorkbenchFromExtension(msgid: number, data: any) {
    const views = this.observer.getWorkbenchView()
    let fragments = []
    for (let view of views) {
      fragments.push({name: view.name, html: '<span>extension</span>'})
    }
    return {type: ReplyType.REPLY_WORKBENCH_VIEW, data: fragments}
  }

  private observer: WorkbenchObserver;
}
