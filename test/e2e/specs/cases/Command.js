import { startCivet, closeCivet, mainPage } from '../../modules/base'
const util = require('../../util')
const {describe, it} = require('mocha')
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
describe('# Command Test', function (resolve, reject) {
  this.timeout(60 * 1000)
  let finish = false
  let connected = false
  let mainWindowPage = mainPage
  let sock
  const tryConnect = function() {
    const WebSock = require('ws')
    sock = new WebSock('ws://localhost:20401')
    sock.on('message', (str) => {
      const msg = JSON.parse(str.toString())
      console.debug('recieve command:', msg.cmd)
      switch(msg['cmd']) {
        case 'global.library.action.create':
          break
        case 'global.debug.action.close':
          finish = true
          break
        default:
        break
      }
    })
  }
  before(() => {
    // sock
    (async function(done) {
      await util.wait(10000)
      tryConnect()
      connected = true
    })()
  })

  it('execute command: global.library.action.create', function(done) {
    (async function() {
      while(!connected) {
        await util.wait(1000)
      }
      await util.wait(1500)
      console.debug('send websocket message 1')
      sock.send(JSON.stringify({cmd: 'global.library.action.create', params: {name: 'newlib', path: '.'}}))
      console.debug('send websocket message 2')
      done()
    })()
  })
  it('execute command: global.debug.action.close', function(done) {
    (async function() {
      while(!connected) {
        await util.wait(1000)
      }
      sock.send(JSON.stringify({cmd: 'global.debug.action.close'}))
      done()
    })()
  })
  after((done) => {
    (async function(done) {
      while(!finish) {
        await util.wait(1000)
      }
      sock.close()
      done()
    })(done)
  })
})