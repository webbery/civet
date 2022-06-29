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

export enum InternalCommand {
  DeleteResources = 'deleteResources',
  ExportResources = 'exportResources',
  OpenContainingFolder = 'OpenContainingFolder'
}

class CommandService {
  constructor() {
  }

  on(target: string, command: string, listener: any) {
    _cv_events.on(target, command, listener)
  }

  registInternalCommand(target: string, command: string, vue: any) {
    switch(command) {
      case InternalCommand.DeleteResources:
        _cv_events.on(target, command, (fileid: Array<number>) => {
          console.info('InternalCommand.DeleteResources', fileid)
          vue.$store.dispatch('removeFiles', fileid)
        })
        break
      case InternalCommand.ExportResources:
        _cv_events.on(target, command, (filespath: Array<string>) => {
          const ipcRenderer = require('electron').ipcRenderer
          ipcRenderer.send('export2Diectory', filespath)
        })
        break
      case InternalCommand.OpenContainingFolder:
        const { shell } = require('@electron/remote')
        console.debug('open', target)
        shell.showItemInFolder(target)
        break
      default:
        break
    }
  }
}

export const commandService = new CommandService()