const base = require('./base')

const MAP_LAYOUT = 1

module.exports = {
  selectResource: async function(page) {
    await base.switchLayout(page, MAP_LAYOUT)
  },
  removeResource: async function(page) {
    await base.switchLayout(page, MAP_LAYOUT)
  },
  selectClass: async function(page) {
    await base.switchLayout(page, MAP_LAYOUT)
  },
  intoClass: async function(page) {
    await base.switchLayout(page, MAP_LAYOUT)
  },
  removeClass: async function(page) {
    await base.switchLayout(page, MAP_LAYOUT)
  }
}