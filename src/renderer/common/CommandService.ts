import { service } from './RendererService'
import { IPCNormalMessage } from '../../public/IPCMessage'
import path from 'path'

declare let _cv_events: any;
declare let _cv_messageSender_: any;

export enum InternalCommand {
  DeleteResources = 'deleteResources',
  ExportResources = 'exportResources',
  OpenContainingFolder = 'OpenContainingFolder',
  AnalysisResource = 'ReAnalysisResource'
}

/**
 * An IClientCommand refers a command in renderer
 */
export interface IClientCommand {
  id: string;
  when: string;
  handler: (params: any) => void;
}
class CommandService {
  constructor() {
  }

  on(target: string, command: string, listener: any) {
    _cv_events.on(target, command, listener)
  }

  clearCommand(target: string) {
    for (let command in InternalCommand) {
      console.debug('clean command', target, command)
      _cv_events.clean(target, command)
    }
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
        _cv_events.on(target, command, (fileid: Array<number>) => {
          const { shell } = require('@electron/remote')
          const files = vue.$store.getters.getFiles([fileid])
          console.debug('open folder', fileid, files)
          shell.showItemInFolder(path.normalize(files[0].path))
        })
        break
      case InternalCommand.AnalysisResource:
        _cv_events.on(target, command, (fileid: string) => {
          console.debug('reanalysis resource', fileid)
          vue.$ipcRenderer.send(IPCNormalMessage.UPDATE_RESOUCE_BY_ID, fileid)
        })
        break
      default:
        break
    }
  }
}

export const commandService = new CommandService()