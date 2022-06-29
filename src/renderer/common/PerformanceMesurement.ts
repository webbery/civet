import { PerformanceObserver, performance } from 'perf_hooks'

class PerformanceMesurement {
  #observer: PerformanceObserver;

  constructor() {
    this.#observer = new PerformanceObserver((items) => {
      const measurements = items.getEntriesByType('measure')
      measurements.forEach(measurement => {
        console.debug('performance', measurement.name, measurement.duration)
      })
    })
    this.#observer.observe({ entryTypes: ['measure'] })
  }

  mark(name: string) {
    performance.mark(name)
  }
  
  measure(name: string, begin: string, end: string) {
    performance.measure(name, begin, end)
  }
}

export const performanceMesurement = new PerformanceMesurement()