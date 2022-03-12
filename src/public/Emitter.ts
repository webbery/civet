import { EventEmitter } from 'events'

export class Emitter {
  #event: EventEmitter;

  constructor() {
    this.#event = new EventEmitter()
  }

  on(event: string, listener: (...args: any[]) => void, option: any = undefined) {
    const done = (...args: any[]) => {
      if (!option) listener(...args)
      else listener(option, ...args)
      this.#event.emit('done')
    }
    this.#event.on(event, done)
  }

  emit(event: string, ...args: any): boolean {
    return this.#event.emit(event, ...args)
  }

  emitAsync(event: string, ...args: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const done = () => {
        resolve(true)
      }
      this.#event.on('done', done)
      this.#event.emit(event, ...args)
    })
  }
}