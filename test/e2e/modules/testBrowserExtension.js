const util = require('../util')
const {expect, assert} = require('chai')
const WebSock = require('ws')

let sock
let dbs
let msgid = 0

const AddResource = 'addResource'
const GetAllResourceDB = 'getAllDB'
const GetCurrentDB = 'getCurrentDB'

const NotifyDBChanged = 'notifyDBChanged'
const NotifyDownloadError = 'notifyDownloadError'
const NotifyDownloadSuccess = 'notifyDownloadSuccess'
const NotifyConnectError = 'notifyConnectError'
const NotifyAllResourceDB = 'notifyAllResourceDB'
const NotifyCurrentDB = 'notifyCurrentDB'
const NotifyReconnect = 'notifyReconnect'

module.exports = {
  dbs: dbs,
  run: async (done, page) => {
    sock = new WebSock('ws://localhost:21313')
    let dbs = []
    sock.on('message', (str) => {
      const data = JSON.parse(str)
      // console.info(data)
      switch(data.method) {
        case NotifyCurrentDB:
          dbs = data['params']['curdb']
          // console.info('recieve:', dbs)
          assert(dbs !== undefined)
          break;
        case NotifyDownloadSuccess:
          // console.debug(`download success ${JSON.stringify(data['params'])}`)
          assert(data.params.url || data.params.location )
          if (!data['params']['url']) {
            done()
          }
          break;
        case NotifyDownloadError:
          // console.error(`download fail: ${JSON.stringify(data)}`)
          assert(data.params.url.length > 0)
          break;
        case NotifyDBChanged:
          break;
        default:
          console.info('recieve 111:', data.id)
          break;
      }
    })
    sock.on('open', function (data) {
      // console.info('websocket open', data)
    })
    while(dbs.length === 0) {
      await util.wait(1000)
    }
    // switch to test resource database

    const msgAddResource = {id: ++msgid, method: AddResource, params: {
      db: dbs[0], url: 'https://cn.bing.com/th?id=OHR.BurleighHeads_ZH-CN6052781534_1920x1080.jpg&rf=LaDigue_1920x1080.jpg&pid=hp'}
    }
    sock.send(JSON.stringify(msgAddResource))
    await util.wait(1000)
    const msgAddWrongResource = {id: ++msgid, method: AddResource, params: {
      db: dbs[0], url: 'https://cn.bing.com/thaf'}
    }
    sock.send(JSON.stringify(msgAddWrongResource))
    // add local image to civet
    await util.wait(1000)
    const fs = require('fs')
    const buffer = fs.readFileSync('static/icon.png')
    const msgAddBufferResource = {id: ++msgid, method: AddResource, params: {
      db: dbs[0], name: 'from_browser.png', bin: buffer}
    }
    sock.send(JSON.stringify(msgAddBufferResource))
  },
  close: () => { if(sock) sock.close()}
}
