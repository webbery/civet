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

for (let extension of dirs) {
  if (extension === 'build.js') continue
  console.info('build extensions', extension)
  const pack = fs.readFileSync('./extensions/' + extension + '/package.json', 'utf-8')
  const jsn = JSON.parse(pack)
  for (let name in jsn['dependencies']) {
    let child = execSync('node -p "require(\'' + name + '\') === undefined')
    if (child === 'false') {
      console.info(`install ${name}@${jsn['dependencies'][name]}`)
      runCommand('npm install -S ' + name + '@' + jsn['dependencies'][name])
    }
  }
  process.chdir('./extensions/' + extension)
  runCommand('tsc main.ts')
  process.chdir('../..')
}
// process.chdir('..')
