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
      console.debug('pong:', str.toString())
      finish = true
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

  it('execute command: library.create', function(done) {
    (async function() {
      while(!connected) {
        await util.wait(1000)
      }
      console.debug('send websocket message 1')
      sock.send('library.create')
      console.debug('send websocket message 2')
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