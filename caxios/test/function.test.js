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
    assert(snaps.length === 1)
  })
  it('get untag files', function() {
    let untags = instance.getUnTagFiles()
    assert(untags.length === 1)
  })
  it('set file tag', function() {
    assert(instance.setTags({id: fileids, tag: ['test']}) === true)
  })
  it('get untag files again', function() {
    let untags = instance.getUnTagFiles()
    expect(untags).to.have.lengthOf(0)
  })
  it('add class', function() {
    let result = instance.addClasses(['class1', 'class2'])
    expect(result).to.equal(true)
  })
  it('add files to class', function() {
    let result = instance.addClasses({id: [fileids[0]], class: ['type1', 'type2']})
    expect(result).to.equal(true)
  })
  it('update file meta info', function() {
    instance.updateFile({id: [fileids[0]], filename: '测试'})
  })
  it('update files tags', function() {
    instance.updateFileTags({id: [fileids[0]], tag: ['newTag']})
  })
  it('update files class', function() {
    let result = instance.updateFileClass({id: [fileids[0]], class: ['newClass']})
    expect(result).to.equal(true)
  })
  it('update class name', function() {
    instance.updateClassName('newClass', '新分类')
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
  it('get all tags', function() {
    const tags = instance.getAllTags()
    expect(tags).to.include.keys('t')
    //expect(tags).to.have.deep.property('t[0].name', 'test')
  })
  it('get all classes', function() {
    const allClasses = instance.getAllClasses()
    console.info(allClasses)
    expect(allClasses).to.lengthOf(5)
  })
  it('get file tags', function() {
    let result = instance.getTagsOfFiles({id: [snaps[0].id]})
    expect(result).to.lengthOf(1)
  })
  it('find files success', function() {
    instance.findFiles({tag: 'test'})
    // instance.findFiles({size: {$gt: 10240, $lt: 21000}})
  })
  it('search files', function() {
    instance.searchFiles('分类')
  })
  after(function() {
    instance.release()
  })
})

describe('civetkern clean test', function() {
  before(function() {
    assert(instance.init(cfg) === true)
  })
  let snaps = null
  it('remove file class', function() {
    snaps = instance.getFilesSnap(-1)
    assert(snaps.length === 1)
    instance.removeClasses({id: [snaps[0].id], class: ['新分类']})
  })
  it('remove classes', function() {
    instance.removeClasses(['新分类'])
  })
  it('remove file tags', function() {
    instance.removeTags({id: [snaps[0].id], tag: ['test']})
  })
  it('remove files success', function() {
    const result = instance.removeFiles([snaps[0].id])
    assert(result === true)
  })
  after(function() {
    instance.release()
  })
})