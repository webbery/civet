import { EventEmitter } from 'events'

export class Emitter {
  #event: EventEmitter;

  constructor() {
    this.#event = new EventEmitter()
  }

  on(event: string, listener: (...args: any[]) => void) {
    const done = (...args: any[]) => {
      listener(args)
      this.#event.emit('done')
    }
    this.#event.on(event, done)
  }

  emit(event: string, ...args: any): boolean {
    return this.#event.emit(event, args)
  }

  emitAsync(event: string, ...args: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const done = () => {
        resolve(true)
      }
      this.#event.on('done', done)
      this.#event.emit(event, args)
    })
  }
}