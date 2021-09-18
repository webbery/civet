// remote interface function
import { OverviewProxy } from './OverviewProxy'

class RemoteProxy {
    #proxies: Map<string, any>;

    constructor() {
        this.#proxies = new Map<string, any>()
    }
    get(id: string) {
        const proxy = this.#proxies[id]
        if (!proxy) {
            // this.#proxies[id] = new T(id)
        }
        return this.#proxies[id]
    }
}

export default new RemoteProxy()