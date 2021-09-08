
class Node<T> {
  static readonly Undefined = new Node<any>(undefined);
  item: T;
  prev: Node<T>;
  next: Node<T>;

  constructor(elem: T) {
    this.item = elem;
    this.prev = Node.Undefined;
    this.next = Node.Undefined;
  }
}

// export interface Iterator<E> {
//   next(){}
// }

export class LinkedList<T> {
  #start: Node<T> = Node.Undefined;
  #last: Node<T> = Node.Undefined;
  #size: number = 0;

  constructor() {
  }

  get size() {
    return this.#size
  }

  push(element: T) {
    this._insert(element, true)
  }

  pop(): T|undefined {
    if (this.#size === 0) return undefined
    this.#size -= 1
    return this.#start.item;
  }

  private _insert(element: T, isLast: boolean) {
    const node = new Node<T>(element)
    if (this.#start === Node.Undefined) {
      this.#start = node
      this.#last = node
    }
    else if (isLast) {
      const last = this.#last
      this.#last = node
      node.prev = last
      last.next = node
    } else {
      const first = this.#start
      this.#start = node
      node.next = first
      first.prev = node
    }
    this.#size += 1
  }

  private _remove(isLast: boolean): void {
    
  }

  *[Symbol.iterator]() {
    let node = this.#start;
		while (node !== Node.Undefined) {
			yield node.item;
			node = node.next;
		}
  }
}