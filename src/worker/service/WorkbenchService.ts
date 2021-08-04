import { MessagePipeline } from '../MessageTransfer'
import { ReplyType, Message } from '../Message'
import { WorkbenchObserver } from './WorkbenchObserver'
import { injectable } from '../Singleton'

@injectable
export class WorkbenchService {
  constructor(pipeline: MessagePipeline, observer: WorkbenchObserver) {
    this.observer = observer;
    // pipeline.regist('mounted', this.initWorkbenchFromExtension, this)
  }

  initWorkbenchFromExtension(msgid: number, data: any) {
    const views = this.observer.getWorkbenchView()
    let fragments = []
    for (let view of views) {
      console.info('initWorkbenchFromExtension', view)
      fragments.push({name: view.name, html: '<span>extension</span>'})
    }
    // return {type: ReplyType.REPLY_WORKBENCH_VIEW, data: fragments}
  }

  private observer: WorkbenchObserver;
}
