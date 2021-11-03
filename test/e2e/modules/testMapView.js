const base = require('./base')

const MAP_LAYOUT = 1

async function selectResource(page) {
  await base.switchLayout(page, MAP_LAYOUT)
}

module.exports = {
  selectResource: selectResource,
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
  },
  test: async function(page) {
    await selectResource(page)
  }
}