const instance = require('./civetkern')
const util = require('util')

console.info('======FUNCTION=======')
console.info(instance)
console.info('=====================')
let cfg = {
app: {
    first: true,
    default: '图像库'
},
resources:[
    {
    name: '图像库',
    db: {
        path: 'E:/code/nodejs/civet/caxios/build/Debug/tdb'
        //path: 'C:/Users/webberg/AppData/Roaming/Electron/civet'
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
if (false === instance.init(cfg)) {
  console.info('init false')
}

//generateFilesID = util.promisify(instance.generateFilesID)
//addFiles = util.promisify(instance.addFiles)
//getFilesSnap = util.promisify(instance.getFilesSnap)
function testAddFiles() {
//  instance.writeLog("hello log")
//  const queryResult = instance.findFiles({title: 'hello'})
//  console.info('find: ', queryResult)
	console.info('====================testAddFiles==========================')
	const fileids = instance.generateFilesID(2)
	console.info(fileids)
  // let snaps = instance.getFilesSnap(-1)
  // if (!snaps || snaps.length === 0){
  //   console.info('snaps is 0')
  // }
	const t = new Date("Sun Sep 20 2020 12:58:14 GMT+0800 (中国标准时间)");
	console.info(t)
	instance.addFiles([{
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
  console.info('add files')
  
  snaps = instance.getFilesSnap(-1)
  console.info('test', snaps)
  return fileids
  // const filesInfo = instance.getFilesInfo([snaps[1].id])
  
  // console.info('meta: ', JSON.stringify(filesInfo[0].meta[0]))
//  return new Promise(() => {
 //   console.info('new promise')
//  })
}

function testSetTag(filesID){
	console.info('====================testSetTag==========================')
	let untags = instance.getUnTagFiles()
	console.info("UNTAGS: ", untags)
	if(instance.setTags(filesID, ['test'])) {
  	  console.info('set tag success')
	}
	untags = instance.getUnTagFiles()
	console.info("UNTAGS: ", untags)
}

function testFindFile() {
	console.info('====================test Find==========================')
	return instance.findFiles({tag: 'test'})
}

function testRemoveFile(filesID) {
	console.info('====================test Remove File==========================')
	console.info(filesID)
	if (!instance.removeFiles(filesID)) {
		console.info("remove fail")
	}
}

const filesID = testAddFiles()
testSetTag(filesID)
let filesInfo = instance.getFilesInfo(filesID)
filesInfo = testFindFile()
console.info('find result: ', filesInfo)
testRemoveFile(filesID)
filesInfo = instance.getFilesInfo(filesID)
console.info("after remove files: ", filesInfo)
instance.release()

console.info('test finish')