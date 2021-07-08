
module.exports = {
  addClass: async (page) => {
    await page.waitFor(5000)
    const btnAddClass = await page.$('.icon-add-class')
    await btnAddClass.click()
    await page.waitFor(1000)
    const editClass = await page.$('.vtl-input')
    editClass.type('helloworld')
    await editClass.press('Enter')
  }
}