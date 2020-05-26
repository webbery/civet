import localStorage from './LocalStorage'

export class Category {
  constructor(json) {
    console.info(json)
  }

  toJson() {}
}

export class CategoryArray {
  constructor(category) {
    this.data = category
  }

  static async loadFromDB() {
    let category = await localStorage.getAllCategory()
    let allCategory = new CategoryArray(category)
    return allCategory.data
  }
}
