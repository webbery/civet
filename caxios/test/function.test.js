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
          {name: 'type', value: '类型', type: 'str', db: true},
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
    // console.info(t.getTime())
    willBeAdd.push({
      'id': fileids[0],
      'meta': [
        {"name":"path","type":"str","value":"C:\\Users\\webberg\\Pictures\\f2d470a08a1011eab5a4993e17631b31.jpg~tplv-banciyuan-w650.jpg"},
        {"name":"filename","type":"str","value":"f2d470a08a1011eab5a4993e17631b31.jpg~tplv-banciyuan-w650.jpg"},
        {"name":"size","type":"int","value":207879},
        {"name":"datetime","type":"date","value":t},
        {"name":"hash","type":"str","value":"unknow"},
        {"name":"type","type":"str","value":"jpeg"},
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
    expect(instance.setTags({id: [fileids[0]], tag: ['test','标签']})).to.equal(true)
    expect(instance.setTags({id: [fileids[2]], tag: ['test','标签', 'A']})).to.equal(true)
    // expect(instance.setTags({id: [fileids[1]], tag: ['test','标签']})).to.equal(false)
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
    let result = instance.addClasses(['新分类', 'class2', '新分类/新分类'])
    expect(result).to.equal(true)
  })
  it('add files to class', function() {
    let result = instance.addClasses({id: [fileids[0]], class: ['type1', 'type2', '新分类']})
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
  it('update class name', function() {
    // 如果新类名存在，则返回失败; 因为该函数只支持改名, 不支持将旧类别下的所有文件移动到新类别下
    let result = instance.updateClassName('type1', '新分类2')
    expect(result).to.equal(true)
    let childClasses = instance.getClassesInfo('新分类2')
    // console.info('1', childClasses)
    expect(childClasses).to.lengthOf(1)
    result = instance.addClasses(['新分类2/子类'])
    expect(result).to.equal(true)
    childClasses = instance.getClassesInfo('新分类2')
    // console.info('2', childClasses)
    expect(childClasses).to.lengthOf(2)
    result = instance.updateClassName('新分类2/子类', '新分类2/新子类')
    expect(result).to.equal(true)
    instance.addClasses({id: [fileids[0]], class: ['新分类2/新子类']})
    childClasses = instance.getClassesInfo('新分类2')
    // console.info('3', childClasses)
    result = instance.updateClassName('新分类2', '新分类1')
    expect(result).to.equal(true)
    childClasses = instance.getClassesInfo('新分类1')
    // console.info('4', childClasses)
    expect(childClasses).to.lengthOf(2)
    expect(childClasses[0].name).to.equal('新分类1/新子类')
  })
  after(function() {
    instance.release()
  })
})

describe('civetkern read only test', function() {
  before(function() {
    assert(instance.init(cfg, 1) === true)
    // console.info('====')
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
    // console.info(filesInfo)
    expect(filesInfo).to.lengthOf(1)
    // for (let item of filesInfo[0]['meta']) {
    //   console.info(item)
    //   if (item.type === 'date') {
    //     console.info(item.value.toString())
    //   }
    // }
    expect(filesInfo[0]['tag']).to.exist
    expect(filesInfo[0]['tag']).to.include('test')
    expect(filesInfo[0]['tag']).to.include('标签')
  })
  it('get all tags', function() {
    const tags = instance.getAllTags()
    expect(tags).to.include.keys(['T','B'])
    expect(tags['T']).to.lengthOf(1)
    expect(tags['B']).to.lengthOf(1)
  })
  it('get classes info', function() {
    const rootClasses = instance.getClassesInfo()
    // console.info(rootClasses)
    expect(rootClasses).to.lengthOf(4)
    expect(rootClasses[0]).to.have.property('children')
    expect(rootClasses[0].children[0]).to.have.property('name')
    // console.info(rootClasses[0].children[0])
    expect(rootClasses[1]).to.not.have.property('children')
    // 
    expect(rootClasses[2]).to.have.property('children')
    console.info('1')
    expect(rootClasses[2].children).to.lengthOf(2)
    expect(rootClasses[3]).to.have.property('children')
    expect(rootClasses[3]['children']).to.lengthOf(1)
    let childClasses = instance.getClassesInfo('新分类')
    // console.info(childClasses)
    expect(childClasses).to.lengthOf(2)
    childClasses = instance.getClassesInfo('新分类1')
    // console.info(childClasses)
    // [{label: 'test.jpg', type: 'jpg', id: 1}], // [{label: name, type: clz/jpg, children: []}]
  })
  it('get file tags', function() {
    let result = instance.getTagsOfFiles({id: [snaps[0].id]})
    expect(result).to.lengthOf(1)
  })
  it('get classes', function() {
    let result = instance.getClasses()
    //console.info(result)
  })
  it('search files by keyword', function() {
    let result = instance.query({keyword: ['标签']})
    // console.info(result)
    expect(result).to.lengthOf(2)
    //for (let info of result[0].meta) {
    //    console.info(info)
    //}
    result = instance.query({keyword: '新分类1'})
    expect(result).to.lengthOf(2)
    result = instance.query({keyword: '新分类'})
    expect(result).to.lengthOf(1)
    result = instance.query({keyword: 'jpg'})
    expect(result).to.lengthOf(2)
    result = instance.query({keyword: ['A', 'B']})
    expect(result).to.lengthOf(1)
  })
  it('search files by datetime', function() {
    let result = instance.query({datetime: {$gt: new Date('2020-09-20T00:00:00.000Z')}})
    expect(result).to.lengthOf(1)
    let day = new Date(new Date().toLocaleDateString())
    day.setFullYear(2020, 8, 20)
    result = instance.query({datetime: {$gt: day}})
    expect(result).to.lengthOf(1)
    day.setMonth(10, 20)
    // console.info(day.getTime())
    result = instance.query({datetime: {$gt: day}})
    expect(result).to.lengthOf(0)
  })
  it('search files by file type', function() {
    let result = instance.query({type: 'jpeg'})
    expect(result).to.lengthOf(1)
  })
  it('search by tag', function() {
    let result = instance.query({tag: '标签'})
    expect(result).to.lengthOf(2)
  })
  it('search by class', function () {
    let result = instance.query({class: 'type1'})
    expect(result).to.lengthOf(0)
    result = instance.query({class: '新分类1'})
    expect(result).to.lengthOf(1)
    result = instance.query({class: ['新分类1']})
    expect(result).to.lengthOf(1)
    // result = instance.query({class: ['新分类']})
  })
  it('search ensamble', function() {
    let result = instance.query({type: 'jpeg', keyword: 'A'})
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
    // instance.removeClasses({id: [snaps[0].id], class: ['新分类', 'type1', 'class3']})
    finfo = instance.getFilesInfo([snaps[0].id])
    // console.info(finfo);
  })
  it('remove classes', function() {
    let rootClasses = instance.getClassesInfo()
    console.info(rootClasses)
    expect(rootClasses).to.lengthOf(4)
    instance.removeClasses(['新分类1'])
    console.info('----------------')
    rootClasses = instance.getClassesInfo()
    console.info(rootClasses)
    expect(rootClasses).to.lengthOf(3)
    // let finfo = instance.getFilesInfo([snaps[0].id])
    // // console.info(finfo);
    // expect(finfo[0].class).to.include('type2')
    // expect(finfo[0].class).not.to.include('新分类1')
    // instance.removeClasses(['新分类1'])
    // rootClasses = instance.getClasses()
    // console.info('----------------')
    // console.info(rootClasses)
    // expect(rootClasses).to.lengthOf(3)//.withErrorMessage('should be keep 2 classes')
    instance.removeClasses(['新分类', 'class2', 'type2', '新分类2'])
    rootClasses = instance.getClassesInfo()
    console.info(rootClasses)
    expect(rootClasses).to.lengthOf(0)
    //const rootClasses = instance.getClasses()
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