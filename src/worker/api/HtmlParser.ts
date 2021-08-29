import processTpl from './process-tpl'

export default function importHTML(html: string) {
  return processTpl(html, null)
}