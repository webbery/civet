const {describe, it} = require('mocha')
const {expect, assert} = require('chai')
const instance = require('../build/Release/civetkern')

let cfg = {
  app: {
      first: true,
      default: '图像库'
  },
  resources:[
      {
      name: '图像库',
      db: {
          path: 'tdb'
      },
      meta: [
          {name: 'color', value: '主色', type: 'color', db: true},
          {name: 'datetime', value: '创建日期', type: 'date', db: true},
          {name: 'size', value: '大小', type: 'int', db: true},
          {name: 'filename', value: '文件名', type: 'str', db: false}
      ]
      }
  ]
}
describe('civetkern add test', function() {
  before(function() {
    assert(instance.init(cfg) === true)
  })
  let fileids
  it('generate files id success',  function() {
	  fileids = instance.generateFilesID(2)
    assert(fileids.length === 2)
  })
  it('add files success', function() {
    const t = new Date("Sun Sep 20 2020 12:58:14 GMT+0800 (中国标准时间)");
    const result = instance.addFiles([{
      'id': fileids[0],
      'meta': [
        {"name":"path","type":"str","value":"C:\\Users\\webberg\\Pictures\\f2d470a08a1011eab5a4993e17631b31.jpg~tplv-banciyuan-w650.jpg"},
        {"name":"filename","type":"str","value":"f2d470a08a1011eab5a4993e17631b31.jpg~tplv-banciyuan-w650.jpg"},
        {"name":"size","type":"int","value":207879},
        {"name":"datetime","type":"date","value":t},
        {"name":"hash","type":"str","value":"unknow"},
        {"name":"type","type":"str","value":"unknow"},
        {"name":"width","type":"int","value":650},
        {"name":"height","type":"int","value":650}
      ],
      keyword: undefined,
      width: 650
    }])
    assert(result === true)
  })
  it('get file snaps success', function() {
    let snaps = instance.getFilesSnap(-1)
    assert(snaps.length !== 0)
  })
  it('get untag files', function() {
    let untags = instance.getUnTagFiles()
    assert(untags.length === 1)
  })
  it('set file tag', function() {
    assert(instance.setTags(fileids, ['test']) === true)
  })
  it('get untag files again', function() {
    let untags = instance.getUnTagFiles()
    assert(untags.length === 0)
  })
  it('find files success', function() {
    let result = instance.findFiles({tag: 'test'})
  })
  after(function() {
    instance.release()
  })
})

describe('civetkern read only test', function() {
  before(function() {
    assert(instance.init(cfg, 1) === true)
  })
  let snaps = null
  it('get file snaps success', function() {
    snaps = instance.getFilesSnap(-1)
    assert(snaps.length === 1)
  })
  it('get files info success', function() {
    let filesInfo = instance.getFilesInfo([snaps[0].id])
    assert(filesInfo.length === 1)
  })
  it('find files success', function() {})
  after(function() {
    instance.release()
  })
})

describe('civetkern clean test', function() {
  before(function() {
    assert(instance.init(cfg) === true)
  })
  it('remove files success', function() {
    let snaps = instance.getFilesSnap(-1)
    const result = instance.removeFiles([snaps[0].id])
    assert(result === true)
  })
  after(function() {
    instance.release()
  })
})