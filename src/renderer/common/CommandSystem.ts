import { IPCNormalMessage } from '@/../public/IPCMessage'
import { config } from '@/../public/CivetConfig'

export let CommandSystem: CommandSystemImpl|null = null

type CommandEnvokeFunction = ((args: any) => boolean) | ((args: any) => Promise<boolean>)

class CommandSystemImpl {
  #store: any;
  #ipcRenderer: any;
  #commands: Map<string, any> = new Map;
  #connections: CommandProxy[] = [];

  constructor(vueStore: any, ipcRenderer: any) {
    this.#store = vueStore
    this.#ipcRenderer = ipcRenderer
  }

  async execute(command: string, args: any): Promise<boolean> {
    if (!this.#commands.has(command)) return false
    const invoker = this.#commands.get(command) as CommandEnvokeFunction
    return invoker(args)
  }

  addConntion(proxy: CommandProxy) {
    this.#connections.push(proxy)
  }

  registCommand(command: string, invoker: CommandEnvokeFunction) {
    if (this.#commands.has(command)) return
    this.#commands.set(command, invoker)
  }
}

class CommandProxy{
  constructor(ws: any) {
    ws.on('message', async function(data: string) {
      const msg = JSON.parse(data.toString())
      console.debug('execute command:', msg)
      if (await CommandSystem!.execute(msg['cmd'], msg.params)) {
        ws.send(JSON.stringify({cmd: msg['cmd'], result: true}))
      } else {
        ws.send(JSON.stringify({cmd: msg['cmd'], result: false}))
      }
    })
  }
}

let css = null
export function registCommandSystem(vue: any) {
  CommandSystem = new CommandSystemImpl(vue.$store, vue.$ipcRenderer)
  console.debug('mode:', process.env.NODE_ENV)
  // the proxy connect with test which communicate with command system
  // command, performance or other test will use it.
  if ('production' !== process.env.NODE_ENV) {
    const WebSocketServer = require('ws').Server
    css = new WebSocketServer({address: 'localhost', port: 20401 })
    css.on('connection', function(ws: any) {
      console.debug('new connection of command system')
      CommandSystem!.addConntion(new CommandProxy(ws))
    })
  }
  // regist system command
  // create resource library
  CommandSystem.registCommand('global.library.action.create', (params: any): Promise<boolean> => {
    config.addResource(params.name, params.path)
    console.info('config:', config)
    config.save()
    vue.$store.dispatch('switchResource', params.name)
    return vue.$ipcRenderer.get(IPCNormalMessage.REINIT_DB, params.name)
  })
  // retrieve all resources, params indecate which resource's path should be retrieved.
  CommandSystem.registCommand('global.library.action.getall', (params: any): Promise<boolean> => {
    return vue.$store.dispatch('getClassesAndFiles', params)
  })
  CommandSystem.registCommand('global.library.action.unclassify', (params: any): Promise<boolean> => {
    return vue.$store.dispatch('getUncategoryResources')
  })
  CommandSystem.registCommand('global.library.action.untag', (params: any): Promise<boolean> => {
    return vue.$store.dispatch('getUntagResources')
  })
  CommandSystem.registCommand('global.resource.action.add', (params: any): Promise<boolean> => {
    vue.$ipcRenderer.send(IPCNormalMessage.ADD_RESOURCES_BY_PATHS, params)
    return new Promise(()=>{return true})
  })
}