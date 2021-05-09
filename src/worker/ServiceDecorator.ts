
export function createDecorator<T>(serviceName: string): {(...args: any[]): void; type: T;} {
  const name = <any>function (target: Function, key: string, index: number): any {
    console.info('decorate: ', target, index, key)
  }
  return name
}