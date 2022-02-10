/**
** global html event
**/
class GlobalEvents {
  #events: Map<string, Array<(data: any) => void>> = new Map();
  #finally: Map<string, (data: any) => void> = new Map();

  addEventListener(event: string, callback: (data: any) => void, capture: boolean) {
    if (!this.#events.has(event)) {
      const self = this
      const wrapper = function (data: any): void {
        console.debug('event:', event)
        const callbacks = self.#events.get(event)
        for (let callback of callbacks!) {
          callback(data)
        }
        if (self.#finally.has(event)) self.#finally.get(event)!(data)
      }
      document.addEventListener(event, wrapper, capture)
      this.#events.set(event, [])
    }
    let events = this.#events.get(event)
    events!.push(callback)
  }

  setEventFinishLisetner(event: string, callback: (data: any) => void) {
    this.#finally.set(event, callback)
  }
}

export const globalEvents = new GlobalEvents()
