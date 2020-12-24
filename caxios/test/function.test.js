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
          path: '数据库'
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

const willBeAdd = []
describe('civetkern add test', function() {
  before(function() {
    assert(instance.init(cfg) === true)
  })
  let fileids
  const genCount = 4
  it('generate files id',  function() {
	  fileids = instance.generateFilesID(genCount)
    expect(fileids).to.have.lengthOf(genCount)
    let t = new Date("Sun Sep 20 2020 12:58:14 GMT+0800 (中国标准时间)")
    willBeAdd.push({
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
    })
    willBeAdd.push({
      'id': fileids[2],
      'meta': [
        {"name":"path","type":"str","value":"C:\\Users\\webberg\\Pictures\\06cc22608a1111eab5a4993e17631b31.jpg~tplv-banciyuan-w650.jpg"},
        {"name":"filename","type":"str","value":"06cc22608a1111eab5a4993e17631b31.jpg~tplv-banciyuan-w650.jpg"},
        {"name":"size","type":"int","value":267028},
        //{"name":"datetime","type":"date","value":t.getTime()},
        {"name":"hash","type":"str","value":"unknow"},
        {"name":"type","type":"str","value":"unknow"},
        {"name":"width","type":"int","value":650},
        {"name":"height","type":"int","value":1091}
      ],
      keyword: 'test'
    })
  })
  it('add files', function() {
    const result = instance.addFiles(willBeAdd)
    assert(result === true)
  })
  it('get file snaps success', function() {
    let snaps = instance.getFilesSnap(-1)
    expect(snaps).to.have.lengthOf(willBeAdd.length)
    expect(snaps[0]['step']).to.be.equal(1)
  })
  it('get untag files', function() {
    let untags = instance.getUnTagFiles()
    expect(untags).to.have.lengthOf(willBeAdd.length)
  })
  it('set file tag', function() {
    assert(instance.setTags({id: fileids, tag: ['test','标签']}) === true)
  })
  it('get untag files again', function() {
    let untags = instance.getUnTagFiles()
    expect(untags).to.have.lengthOf(0)
  })
  it('get unclassify files', function() {
    const unclasses = instance.getUnClassifyFiles()
    expect(unclasses).to.have.lengthOf(willBeAdd.length)
  })
  it('add class', function() {
    let result = instance.addClasses(['class1', 'class2', 'class1/class3'])
    expect(result).to.equal(true)
  })
  it('add files to class', function() {
    let result = instance.addClasses({id: [fileids[0]], class: ['type1', 'type2']})
    expect(result).to.equal(true)
  })
  it('get unclassify files', function() {
    const unclasses = instance.getUnClassifyFiles()
    expect(unclasses).to.have.lengthOf(willBeAdd.length - 1)
  })
  it('update file meta info', function() {
    instance.updateFile({id: [fileids[0]], filename: '测试'})
    let info = instance.getFilesInfo([fileids[0]])
    let meta = info[0]['meta']
    for (let item of meta) {
        if (item.name === 'filename'){
            expect(item.value).to.equal('测试')
            break
        }
    }
  })
  //it('update files tags', function() {
  //  instance.updateFileTags({id: [fileids[0]], tag: ['newTag']})
  //})
  //it('update files class', function() {
    //let result = instance.updateFileClass({id: [fileids[0]], class: ['/newClass', 'class1/class3']})
    //expect(result).to.equal(true)
  //})
  it('update class name', function() {
    instance.updateClassName('type1', '新分类')
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
    expect(snaps).to.lengthOf(willBeAdd.length)
    expect(snaps[0].step).to.equal(7)
  })
  it('get files info', function() {
    // console.info('file id', snaps[0])
    let filesInfo = instance.getFilesInfo([snaps[0].id])
    console.info(filesInfo)
    expect(filesInfo).to.lengthOf(1)
    // for (let item of filesInfo[0]['meta']) {
    //   console.info(item)
    //   if (item.type === 'date') {
    //     console.info(item.value.toString())
    //   }
    // }
    expect(filesInfo[0]['tag']).to.exist
    expect(filesInfo[0]['tag']).to.not.include('test')
    expect(filesInfo[0]['tag']).to.not.include('标签')
    expect(filesInfo[0]['tag']).to.include('newTag')
  })
  it('get all tags', function() {
    const tags = instance.getAllTags()
    expect(tags).to.include.keys(['T','B'])
    expect(tags['T']).to.lengthOf(1)
    expect(tags['B']).to.lengthOf(1)
  })
  it('get classes', function() {
    const rootClasses = instance.getClasses()
    // console.info(rootClasses)
    expect(rootClasses).to.lengthOf(5)
    expect(rootClasses[0]).to.have.property('children')
    expect(rootClasses[2]).to.not.have.property('children')
    expect(rootClasses[3]).to.not.have.property('children')
    expect(rootClasses[4]).to.have.property('children')
    expect(rootClasses[4]['children']).to.lengthOf(1)
    // [{label: 'test.jpg', type: 'jpg', id: 1}], // [{label: name, type: clz/jpg, children: []}]
  })
  it('get file tags', function() {
    let result = instance.getTagsOfFiles({id: [snaps[0].id]})
    expect(result).to.lengthOf(1)
  })
  it('search files', function() {
    let result = instance.query({keyword: ['标签']})
    // console.info(result)
    expect(result).to.lengthOf(2)
    //for (let info of result[0].meta) {
    //    console.info(info)
    //}
    //result = instance.query({size: {$gt: 10240, $lt: 21000}})
    //expect(result).to.lengthOf(1)
    result = instance.findFiles({datetime: {$gt: new Date('2020-09-20T00:00:00.000Z')}})
    expect(result).to.lengthOf(1)
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
    assert(snaps.length >= 1)
    let finfo = instance.getFilesInfo([snaps[0].id])
    // console.info(finfo);
    instance.removeClasses({id: [snaps[0].id], class: ['新分类', 'type1', 'class3']})
    finfo = instance.getFilesInfo([snaps[0].id])
    // console.info(finfo);
  })
  it('remove classes', function() {
    let rootClasses = instance.getClasses()
    expect(rootClasses).to.lengthOf(4)
    // console.info(rootClasses)
    instance.removeClasses(['class1'])
    rootClasses = instance.getClasses()
    console.info(rootClasses)
    expect(rootClasses).to.lengthOf(3)
    let finfo = instance.getFilesInfo([snaps[0].id])
    // console.info(finfo);
    expect(finfo[0].class).to.include('type2')
    //const rootClasses = instance.getClasses()
    //console.info(rootClasses)
  })
  it('remove file tags', function() {
    instance.removeTags({id: [snaps[0].id], tag: ['test']})
  })
  it('remove files success', function() {
    const result = instance.removeFiles([snaps[0].id, snaps[1].id])
    assert(result === true)
  })
  after(function() {
    instance.release()
  })
})