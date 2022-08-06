

class CommandSystemImpl {
  #store: any;
  #ipcRenderer: any;
  #connections: CommandProxy[] = [];

  constructor(vueStore: any, ipcRenderer: any) {
    this.#store = vueStore
    this.#ipcRenderer = ipcRenderer
  }

  addConntion(proxy: CommandProxy) {
    this.#connections.push(proxy)
  }
}

class CommandProxy{
  constructor(ws: any) {
    ws.on('message', function(data: string) {
      console.debug('execute command:', data)
      ws.send('recieved: ' + data)
    })
  }
}

let commandSystemImpl:CommandSystemImpl|null = null
let css = null
export function registCommandSystem(vue: any) {
  commandSystemImpl = new CommandSystemImpl(vue.$store, vue.$ipcRenderer)
  console.debug('mode:', process.env.NODE_ENV)
  // the proxy connect with test which communicate with command system
  // command, performance or other test will use it.
  if ('production' !== process.env.NODE_ENV) {
    const WebSocketServer = require('ws').Server
    css = new WebSocketServer({address: 'localhost', port: 20401 })
    css.on('connection', function(ws: any) {
      console.debug('new connection of command system')
      commandSystemImpl!.addConntion(new CommandProxy(ws))
    })
  }
}
export const CommandSystem = commandSystemImpl