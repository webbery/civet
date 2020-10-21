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
        {name: 'color', value: '主色', type: 'value', db: true},
        {name: 'size', value: '大小', type: 'value', db: true},
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
	const fileids = instance.generateFilesID(2)
	console.info(fileids)
  // let snaps = instance.getFilesSnap(-1)
  // if (!snaps || snaps.length === 0){
  //   console.info('snaps is 0')
  // }
	instance.addFiles([{
		'id': fileids[0],
		'meta': [
		{"name":"path","type":"str","value":"C:\\Users\\webberg\\Pictures\\f2d470a08a1011eab5a4993e17631b31.jpg~tplv-banciyuan-w650.jpg"},
		{"name":"filename","type":"str","value":"f2d470a08a1011eab5a4993e17631b31.jpg~tplv-banciyuan-w650.jpg"},
		{"name":"size","type":"value","value":207879},
		{"name":"datetime","type":"value","value":"Sun Sep 20 2020 12:58:14 GMT+0800 (中国标准时间)"},
		{"name":"hash","type":"str","value":"unknow"},
		{"name":"type","type":"str","value":"unknow"},
		{"name":"width","type":"value","value":650},
		{"name":"height","type":"value","value":650}
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
	if(instance.setTags({id:filesID, tag: ['test']})) {
  	  console.info('set tag success')
	}
}


const filesID = testAddFiles()
testSetTag(filesID)
const filesInfo = instance.getFilesInfo(filesID)
console.info('filesInfo', filesInfo)
instance.release()

console.info('test finish')