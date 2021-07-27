import { window, ConditionItem } from 'civet'

const conditionItem = window.createConditionItem('test')
conditionItem.html = '<select>\
  <option value ="volvo">Volvo</option>\
  <option value ="saab">Saab</option>\
  <option value="opel">Opel</option>\
  <option value="audi">Audi</option>\
  </select>'

console.info('extension info:', window.searchBar)
window.searchBar.items.push(conditionItem)