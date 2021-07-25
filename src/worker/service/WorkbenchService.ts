import { MessagePipeline } from '../MessageTransfer'
import { ReplyType, Message } from '../Message'
import { WorkbenchObserver } from './WorkbenchObserver'

export class WorkbenchService {
  constructor(pipeline: MessagePipeline, observer: WorkbenchObserver) {
    this.observer = observer;
    pipeline.regist('getWorkbenchView', this.initWorkbenchFromExtension, this)
  }

  initWorkbenchFromExtension(msgid: number, data: any) {
    return {type: ReplyType.REPLY_WORKBENCH_VIEW, data: {}}
  }

  private observer: WorkbenchObserver;
}
