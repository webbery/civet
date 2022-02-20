const base = require('./base')

const CSSContent = '#_cv_content_view'
const CSSBack = '.el-icon-back'
const CSSNext = '.__cv_next'
const CSSPrev = '.__cv_prev'
const CSSTitle = ''

async function goNext(page) {
  const nextBtns = await page.$$(CSSNext)
  assert(nextBtns.length > 0)
  await nextBtns[0].click()
}
async function goPrev(page) {
  const prevBtns = await page.$$(CSSPrev)
  assert(prevBtns.length > 0)
  await prevBtns[0].click()
}
async function backPage(page) {
  const backBtns = await page.$$(CSSBack)
  assert(backBtns.length > 0)
  await backBtns[0].click()
}

async function isPanelDisplay(page) {
  await page.waitForSelector(CSSContent, {timeout: 5000})
}

module.exports = {
  backPage: backPage,
  isPanelDisplay: isPanelDisplay,
  goNext: goNext,
  goPrev: goPrev
}
