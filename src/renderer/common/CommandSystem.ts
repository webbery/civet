

class CommandSystemImpl {
  #store: any;
  #ipcRenderer: any;

  constructor(vueStore: any, ipcRenderer: any) {
    this.#store = vueStore
    this.#ipcRenderer = ipcRenderer
  }
}

class CommandProxy{
  constructor(ws: any) {
    ws.on('message', function(data: string) {
      console.debug('execute command:', data)
    })
  }
}

let commandSystemImpl = null
let proxy = null
export function registCommandSystem(vue: any) {
  commandSystemImpl = new CommandSystemImpl(vue.$store, vue.$ipcRenderer)
  console.debug('mode:', process.env.NODE_ENV)
  // the proxy connect with test which communicate with command system
  // command, performance or other test will use it.
  if ('production' !== process.env.NODE_ENV) {
    const WebSocketServer = require('ws').Server
    proxy = new WebSocketServer({address: 'localhost', port: 21401 })
    proxy.on('connection', function(ws: any) {
      new CommandProxy(ws)
    })
  }
}
export const CommandSystem = commandSystemImpl