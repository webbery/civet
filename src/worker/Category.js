import localStorage from './LocalStorage'

export class Category {
  constructor(json) {
    console.info(json)
  }

  toJson() {}
}

export class CategoryArray {
  constructor(category) {
    this.data = []
    for (let n in category) {
      console.info('category[n]', category[n])
      this.data.push({'label': category[n].label, type: '', 'children': []})
    }
  }

  static async loadFromDB() {
    let category = await localStorage.getAllCategory()
    let allCategory = new CategoryArray(category)
    return allCategory.data
  }
}
