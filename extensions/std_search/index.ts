import { window, utility } from 'civet'

export function activate() {
  const enumSelector = window.searchBar.createEnumSelector('type')
  enumSelector.addEnumeration('jpg')
  window.searchBar.addSelector(enumSelector)
}