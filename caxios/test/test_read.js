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
if (false === instance.init(cfg, 1)) {
  console.info('init false')
}

function testFindFile() {
  return instance.findFiles({tag: 'test'})
}


const snaps = instance.getFilesSnap(-1)
if (snaps.length) {
console.info(snaps)
    let filesInfo = instance.getFilesInfo([snaps[0].id])
    filesInfo = testFindFile()
    console.info('filesInfo', filesInfo)
}
instance.release()

console.info('test finish')