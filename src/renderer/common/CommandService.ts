import { service } from './RendererService'
import { IPCNormalMessage } from '../../public/IPCMessage'
import EventEmitter from 'events';

declare let _cv_events: any;
declare let _cv_messageSender_: any;

class CommandMenu {
  context: string;
  command: string;
  group: string;
  name: string;
}

export enum CommandType {
  CTMenu = 0
}

class CommandService {
  constructor() {
  }

  on(target: string, command: string, listener: any) {
    _cv_events.on(target, command, listener)
  }

}

export default new CommandService()