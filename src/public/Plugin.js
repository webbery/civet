export default class JPlugin {
  loadModule(fullpath) {
    const fs = require('fs')
    fs.readFile(fullpath, 'utf-8', (err, data) => {
      if (err) {
          console.error(err)
          return
      }
    })
  }
}
