const instance = require('./civetkern')
const util = require('util')

console.info('======FUNCTION=======')
console.info(instance)
console.info('=====================')
let cfg = {
app: {
    first: true,
    default: 'Í¼Ïñ¿â'
},
resources:[
    {
    name: 'Í¼Ïñ¿â',
    db: {
        path: 'E:/code/nodejs/civet/caxios/build/Debug/tdb'
    },
    meta: [
        {name: 'color', value: 'Ö÷É«', type: 'value', db: true}
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
function test() {
  instance.writeLog("hello log")
  const queryResult = instance.findFiles({title: 'hello'})
  console.info('find: ', queryResult)
/*  const fileids = instance.generateFilesID(2)
  console.info(fileids)
  let snaps = instance.getFilesSnap(-1)
  if (!snaps || snaps.length === 0){
    console.info('snaps is 0')
  }
  instance.addFiles([{
	'id': fileids[0],
	'meta': [
	  {'name': 'title', value: 'hello', type: 'str'},
	  {'name': 'colors', value: '#23A077', type: 'value'},
	]
  }])
  console.info('add files')
  snaps = instance.getFilesSnap(-1)
  console.info('test', snaps)
  const filesInfo = instance.getFilesInfo([fileids[0]])
  console.info('filesInfo', filesInfo)
  console.info('meta: ', JSON.stringify(filesInfo[0].meta[0])) */
//  return new Promise(() => {
 //   console.info('new promise')
//  })
}

test()
//.then((err, result) => {
//  console.info(result)
//})

console.info('test finish')