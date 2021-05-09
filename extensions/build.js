const fs = require('fs')
const dirs = fs.readdirSync('./extensions')
const { execSync } = require('child_process');

function runCommand(cmd) {
  let child = execSync(cmd)
  if (child.error) {
    console.info(child.error)
    return false
  }
  return true
}

process.chdir('./extensions')
for (let extension of dirs) {
  if (extension === 'build.js') continue
  console.info('build extensions', extension)
  process.chdir('./' + extension)
  if (runCommand('npm install')) {
    runCommand('tsc main.ts')
  }
  process.chdir('../')
}
process.chdir('..')
