
const CSSNaviBtn = '.sidenav .el-icon-document'
const CSSAddBtn = '.icon-add-class'
const CSSClassInput = '.vtl-input'
const CSSClassContent = '.vtl-node-content'

async function switchClassPanel(page) {
  await page.waitForSelector(CSSNaviBtn)
  const btnClsNavi = await page.$(CSSNaviBtn)
  await btnClsNavi.click()
}

module.exports = {
  addClass: async (page) => {
    await page.waitForSelector(CSSAddBtn)
    let btnAddClass = await page.$(CSSAddBtn)
    await btnAddClass.click()
    await page.waitForSelector(CSSClassInput)
    const editClass = await page.$(CSSClassInput)
    editClass.type('helloworld')
    await page.waitForTimeout(1000)
    await editClass.press('Enter')
    await page.waitForSelector(CSSClassContent)
    const clazz = await page.$$(CSSClassContent)
    assert(clazz.length >= 1)
  },
  removeClass: async function(page) {
    await switchClassPanel(page)
    await page.waitForSelector(CSSClassContent)
    let itemClasses = await page.$$(CSSClassContent)
    const beforeLength = itemClasses.length
    expect(beforeLength).to.be.above(0)
    await itemClasses[0].click({button: 'right'})
    const CSSMenu = '.cm-ul li'
    await page.waitForSelector(CSSMenu)
    const menus = await page.$$(CSSMenu)
    await menus[3].click()
    itemClasses = await page.$$(CSSClassContent)
    expect(beforeLength).to.be.above(itemClasses.length)
  }
}