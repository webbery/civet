import fs from 'fs'
export const Cache = {
  snaps: [],
  files: {},
  icons: {},
  selectFlag: 'all',
  i18n: {}
}

console.debug('pwd:', process.cwd())
let locale = process.cwd()
if (process.env.NODE_ENV !== 'development') {
  locale += '/resources'
}
locale += '/static/i18n/' + navigator.language + '.properties'
if (fs.existsSync(locale)) {
  const content = fs.readFileSync(locale).toString()
  Cache.i18n = JSON.parse(content)
} else {
  console.error(`i18n ${locale} file not exist`)
}