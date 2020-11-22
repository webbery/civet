export default{
  app() {
    let application = null
    if (process.type === 'browser') {
      application = require('electron').app
    } else {
      application = require('electron').remote.app
    }
    return application
  }
}
