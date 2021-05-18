const fs = require('fs')

export function deleteFolder(path: string) {
  let files = []
  if (fs.existsSync(path)) {
    if (fs.statSync(path).isDirectory()) {
      files = fs.readdirSync(path)
      for (const file of files) {
        const curPath = path + '/' + file
        if (fs.statSync(curPath).isDirectory()) {
          deleteFolder(curPath)
        } else {
          fs.unlinkSync(curPath)
        }
      }
      fs.rmdirSync(path)
    } else {
      fs.unlinkSync(path)
    }
  }
}

export function copyFolder(from: string, to: string) { // 复制文件夹到指定目录
  let files = []
  if (fs.existsSync(to)) { // 文件是否存在 如果不存在则创建
    files = fs.readdirSync(from)
    for (const file of files) {
      const targetPath = from + '/' + file
      const toPath = to + '/' + file
      if (fs.statSync(targetPath).isDirectory()) { // 复制文件夹
        copyFolder(targetPath, toPath)
      } else { // 拷贝文件
        fs.copyFileSync(targetPath, toPath)
      }
    }
  } else {
    fs.mkdirSync(to)
    copyFolder(from, to)
  }
}

