import { ExtensionManager } from '../ExtensionManager'
import { MessagePipeline } from '../MessageTransfer'
import { ExtensionActiveType } from 'worker/ExtensionService';

export class WorkbenchObserver {
  private _listener: ExtensionManager;
  private _pipeline: MessagePipeline;

  constructor(pipline: MessagePipeline, listener: ExtensionManager) {
    this._listener = listener
    this._pipeline = pipline
  }

  getWorkbenchView() {
    this._listener.getExtensionsByType(ExtensionActiveType.ExtView)
  }
}