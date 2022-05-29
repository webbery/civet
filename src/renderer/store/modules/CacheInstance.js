import fs from 'fs'
export const Cache = {
  snaps: [],
  files: {},
  icons: {},
  selectFlag: 'all',
  i18n: {}
}

const locale = 'static/i18n/' + navigator.language + '.properties'
if (fs.existsSync(locale)) {
  const content = fs.readFileSync(locale).toString()
  Cache.i18n = JSON.parse(content)
} else {
  console.error(`i18n ${navigator.language}.properties file not exist`)
}