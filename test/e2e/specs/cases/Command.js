import path from 'path'
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
      switch(msg['cmd']) {
        case 'global.library.action.create':
          assert(true === msg['result'])
          break
        case 'global.debug.action.close':
          finish = true
          break
        case 'global.library.action.getall':
          assert(true === msg['result'])
          break
        case 'global.resource.action.add':
          assert(true === msg['result'])
          break
        default:
          console.debug('recieve command:', msg.cmd)
          assert(false)
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
      sock.send(JSON.stringify({cmd: 'global.library.action.create', params: {name: 'newlib', path: '.'}}))
      done()
    })()
  })
  it('execute command: global.resource.action.add', function(done) {
    (async function() {
      while(!connected) {
        await util.wait(1000)
      }
      await util.wait(1500)
      const fullpath = path.resolve(__dirname, '../../../../static/icon.png')
      console.debug('add png:', fullpath)
      sock.send(JSON.stringify({cmd: 'global.resource.action.add', params: fullpath}))
      done()
    })()
  })
  it('execute command: global.library.action.getall', function(done) {
    (async function() {
      while(!connected) {
        await util.wait(1000)
      }
      await util.wait(1500)
      sock.send(JSON.stringify({cmd: 'global.library.action.getall', params: '/'}))
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