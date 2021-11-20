
const CSSKeyword = '.el-icon-search'
const CSSInput = '.search-group input'

async function searchByKeyword(page, keyword) {
  await page.waitForSelector(CSSInput)
  const keywordInput = await page.$(CSSInput)
  keywordInput.type(keyword)
  await page.waitForTimeout(1000)
  await page.waitForSelector(CSSKeyword)
  const searchBtn = await page.$(CSSKeyword)
  await searchBtn.click()
}

module.exports = {
  searchByKeyword: searchByKeyword
}