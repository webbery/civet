import { window, ContentItemSelectedEvent, ResourceProperty } from 'civet'

function shouldDisplay(prop: ResourceProperty): boolean {
  switch(prop.name) {
    case 'filename':
    case 'color':
    case 'thumbnail':
      return false
    default:
      return true
  }
}

window.onDidSelectContentItem(async (e: ContentItemSelectedEvent) => {
  console.info('onDidSelectContentItem', e)
  let propertyView = window.propertyView
  if (e.items.length === 1) {
    const resource = e.items[0]
    propertyView.name = resource.name
    propertyView.preview = resource.thumbnail
    window.propertyView.colorPanel.color = resource.color
    propertyView.tags = resource.tag
    propertyView.category = resource.category
    propertyView.property.splice(0, propertyView.property.length)
    for (let prop of resource.meta) {
      if (shouldDisplay(prop)) {
        if (prop.name === 'lng' || prop.name === 'lat') {
          let value = parseInt(prop.value)
          value /= 100000.0;
          prop.value = value
        }
        propertyView.property.push(prop);
      }
    }
  }
})
