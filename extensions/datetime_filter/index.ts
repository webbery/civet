import { window } from 'civet'

function raw(a: TemplateStringsArray, ...values: any[]): string
{
  let len = a.length - 1
  let outstr = a[0]
  for(var i=0;i<len;i++)
  {
    outstr += values[i] + a[i+1];
  }
  return outstr;
}

function html(a: TemplateStringsArray, ...values: any[]):HTMLDivElement
{
  let div =document.createElement("div");
  div.innerHTML =raw(a,values);
  return div;
}

// const conditionItem = window.createConditionItem('test')
// conditionItem.html = '<select>\
//   <option value ="volvo">Volvo</option>\
//   <option value ="saab">Saab</option>\
//   <option value="opel">Opel</option>\
//   <option value="audi">Audi</option>\
//   </select>'

// console.info('extension info:', window.searchBar)
// window.searchBar.items.push(conditionItem)