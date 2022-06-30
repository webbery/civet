import { service } from './RendererService'
import { IPCNormalMessage } from '../../public/IPCMessage'
import EventEmitter from 'events'
import path from 'path'

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

  clearCommand(target: string) {}

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
        _cv_events.on(target, command, (fileid: Array<number>) => {
          const { shell } = require('@electron/remote')
          const files = vue.$store.getters.getFiles([fileid])
          console.debug('open folder', fileid, files)
          shell.showItemInFolder(path.normalize(files[0].path))
        })
        break
      default:
        break
    }
  }
}

export const commandService = new CommandService()