import SandBoxManager from './JSSandBox'

const rawHeadAppendChild = HTMLHeadElement.prototype.appendChild
const rawHeadRemoveChild = HTMLHeadElement.prototype.removeChild
const rawBodyAppendChild = HTMLBodyElement.prototype.appendChild
const rawBodyRemoveChild = HTMLBodyElement.prototype.removeChild
const rawHeadInsertBefore = HTMLHeadElement.prototype.insertBefore
const rawRemoveChild = HTMLElement.prototype.removeChild

export function isHijackingTag(tagName?: string) {
  return (
    tagName?.toUpperCase() === 'LINK' ||
    tagName?.toUpperCase() === 'STYLE' ||
    tagName?.toUpperCase() === 'SCRIPT'
  );
}

function hookElementAppendOrInsertOperation(rawOperation: <T extends Node>(node: T, refChild?: Node | null) => T) {
  return function appendOrInsertBefore<T extends Node>(
      thisArg: HTMLHeadElement | HTMLBodyElement,
      newChild: T,
      refChild: Node | null = null,
    ) {
      let element = newChild as any;
      console.debug('hook append:', thisArg, newChild, refChild)
      if (!newChild) return
      if (!isHijackingTag(element.tagName)) {
        return rawOperation.call(thisArg, element, refChild) as T;
      }
      console.debug('hook script', element.tagName)
      switch(element.tagName.toUpperCase()) {
        case 'SCRIPT':
        {
          // put script to current sand box
          const sandbox = SandBoxManager.getCurrentSandBox()
          sandbox?.setElement(element)
        }
          break
        case 'LINK':
          break
        case 'STYLE':
          break
        default:
          break
      }
      return rawOperation.call(thisArg, element, refChild) as T;
    } as typeof rawOperation;
}

export function patchAppendChild() {
  if (HTMLHeadElement.prototype.appendChild === rawHeadAppendChild) {
    HTMLHeadElement.prototype.appendChild = hookElementAppendOrInsertOperation(rawHeadAppendChild)
  }
  if (HTMLBodyElement.prototype.appendChild === rawBodyAppendChild) {
    HTMLBodyElement.prototype.appendChild = hookElementAppendOrInsertOperation(rawBodyAppendChild)
  }
  if (HTMLHeadElement.prototype.insertBefore === rawHeadInsertBefore) {
    HTMLHeadElement.prototype.insertBefore = hookElementAppendOrInsertOperation(rawHeadInsertBefore as <T extends Node>(node: T, refChild?: Node | null) => T)
  }
}

export function unpatchAppendChild() {
  HTMLHeadElement.prototype.appendChild = rawHeadAppendChild
  HTMLBodyElement.prototype.appendChild = rawBodyAppendChild
  HTMLHeadElement.prototype.insertBefore = rawHeadInsertBefore
}

// function getExecutableScript(scriptSrc: string, scriptText: string, proxy: any, strictGlobal: boolean) {
// 	const sourceUrl = isInlineCode(scriptSrc) ? '' : `//# sourceURL=${scriptSrc}\n`;

// 	// 通过这种方式获取全局 window，因为 script 也是在全局作用域下运行的，所以我们通过 window.proxy 绑定时也必须确保绑定到全局 window 上
// 	// 否则在嵌套场景下， window.proxy 设置的是内层应用的 window，而代码其实是在全局作用域运行的，会导致闭包里的 window.proxy 取的是最外层的微应用的 proxy
// 	const globalWindow = (0, eval)('window');
// 	globalWindow.proxy = proxy;
// 	// TODO 通过 strictGlobal 方式切换 with 闭包，待 with 方式坑趟平后再合并
// 	return strictGlobal
// 		? `;(function(window, self, globalThis){with(window){;${scriptText}\n${sourceUrl}}}).bind(window.proxy)(window.proxy, window.proxy, window.proxy);`
// 		: `;(function(window, self, globalThis){;${scriptText}\n${sourceUrl}}).bind(window.proxy)(window.proxy, window.proxy, window.proxy);`;
// }
