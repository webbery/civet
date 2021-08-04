import { ExtensionManager } from '../ExtensionManager'
import { MessagePipeline } from '../MessageTransfer'
import { ExtensionActiveType } from 'worker/ExtensionService';
import { injectable } from '../Singleton'

@injectable
export class WorkbenchObserver {
  private _listener: ExtensionManager;
  private _pipeline: MessagePipeline;

  constructor(pipline: MessagePipeline, listener: ExtensionManager) {
    this._listener = listener
    this._pipeline = pipline
  }

  getWorkbenchView() {
    return this._listener.getExtensionsByType(ExtensionActiveType.ExtView)
  }
}