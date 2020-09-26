// import localStorage from './LocalStorage'
import Kernel from '../public/Kernel'

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
    let category = await Kernel.getAllClasses()
    let allCategory = new CategoryArray(category)
    return allCategory.data
  }
}
