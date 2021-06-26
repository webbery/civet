const util = require('../util')
const {expect, assert} = require('chai')
const WebSock = require('ws')

let sock
let dbs

module.exports = {
  dbs: dbs,
  run: async (done, page) => {
    sock = new WebSock('ws://localhost:21313')
    let dbs = []
    sock.on('message', (str) => {
      const data = JSON.parse(str)
      console.info(data)
      switch(data.id) {
        case 'config':
          dbs = data['config']['db']
          // console.info('recieve:', dbs)
          assert(dbs.length > 0)
          break;
        case 'download':
          // console.error(`download fail: ${data.url}`)
          assert(data.url.length > 0)
          done()
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
    const msgAddResource = {id: 'load', db: dbs[0], data: {url: 'https://cn.bing.com/th?id=OHR.BurleighHeads_ZH-CN6052781534_1920x1080.jpg&rf=LaDigue_1920x1080.jpg&pid=hp'} }
    sock.send(JSON.stringify(msgAddResource))
    await util.wait(1000)
    const msgAddWrongResource = {id: 'load', db: dbs[0], data: {url: 'https://cn.bing.com/thaf'} }
    sock.send(JSON.stringify(msgAddWrongResource))
  },
  close: () => {sock.close()}
}
