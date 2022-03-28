// remove build.log
const fs = require('fs')
if (fs.existsSync('build.log')) {
  fs.rmSync('build.log')
}
if (fs.existsSync('extensions/node_modules')) {
  fs.rmdirSync('extensions/node_modules', { recursive: true, force: true })
}
// remove extensions builds?
