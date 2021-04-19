// import { debounce } from 'lodash'

document.addEventListener('keydown', keyDownHandler)

function keyDownHandler(event: any) {
  if (event.ctrlKey && event.code === 'KeyA') {
    event.preventDefault()
  }
}
export class Shortcut{
  private static _shortcut: Map<string, () => boolean>;
  static bind(shortcut: string, func: () => boolean ) {

  }

}