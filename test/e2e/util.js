function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
};

module.exports = {
  wait: wait,
  printLog: () => {
    console.info('++++++++++++++++++ LOG BEGIN +++++++++++++++++++')
    const os = require('os')
    const fs = require('fs')
    if (os.platform() === 'win32') {
      if (fs.existsSync('C:/Users/runneradmin/AppData/Roaming/civet/logs/civet.log')) {
        const content = fs.readFileSync('C:/Users/runneradmin/AppData/Roaming/civet/logs/civet.log').toString()
        console.info(content)
      }
    } else {

    }
    console.info('++++++++++++++++++  LOG END  +++++++++++++++++++')
  }
}