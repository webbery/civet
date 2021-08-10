import { ViewType } from '@/../public/ExtensionHostType'

export class RendererMessage{
  static IS_DIRECTORY_EXIST: string = 'hasDirectory'
}

export class RendererService {
  constructor() {
    const { ipcRenderer } = require('electron')
  }

  send() {}

  on(type: string, callback:any) {}
}