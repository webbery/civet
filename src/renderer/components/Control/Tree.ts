import { traverseTree } from './tools'
import { v4 as uuidv4 } from 'uuid'

/**
 * Tree data struct
 * Created by ayou on 2017/7/20.
 * @param data: treenode's params
 *   name: treenode's name
 *   isLeaf: treenode is leaf node or not
 *   id: id
 *   dragDisabled: decide if it can be dragged
 *   disabled: desabled all operation
 */
export class TreeNode {
  private id: any;
  private pid: any;
  private parent: any;
  private count: number;
  private children: any = [];
  private isLeaf: any;
  private editable: any;
  private name: string = '';

  constructor(data: any) {
    const { id, isLeaf, editable } = data
    this.id = typeof id === 'undefined' ? uuidv4() : id
    this.parent = null
    this.count = 0
    this.isLeaf = !!isLeaf
    this.editable = editable || false

    // other params
    for (const k in data) {
      if (k !== 'id' && k !== 'children' && k !== 'isLeaf' && k !== 'editable') {
        this[k] = data[k]
      }
    }
  }

  changeName(name: string) {
    this.name = name
  }

  // get name(): string {
  //   return this._name
  // }
  // set name(name: string) {
  //   this._name = name
  // }
  addChildren(children: any) {
    if (Array.isArray(children)) {
      for (let i = 0, len = children.length; i < len; i++) {
        const child = children[i]
        child.parent = this
        child.pid = this.id
      }
      this.children.concat(children)
    } else {
      const child = children
      child.parent = this
      child.pid = this.id
      this.children.push(child)
    }
  }

  // remove self
  remove() {
    const parent = this.parent
    const index = parent.findChildIndex(this)
    parent.children.splice(index, 1)
  }

  // remove child
  private _removeChild(child: any) {
    for (let i = 0, len = this.children.length; i < len; i++) {
      if (this.children[i] === child) {
        this.children.splice(i, 1)
        break
      }
    }
  }

  isTargetChild(target: any) {
    let parent = target.parent
    while (parent) {
      if (parent === this) {
        return true
      }
      parent = parent.parent
    }
    return false
  }

  private moveInto(target: any) {
    if (this.name === 'root' || this === target) {
      return
    }

    // cannot move ancestor to child
    if (this.isTargetChild(target)) {
      return
    }

    // cannot move to leaf node
    if (target.isLeaf) {
      return
    }

    this.parent._removeChild(this)
    this.parent = target
    this.pid = target.id
    if (!target.children) {
      target.children = []
    }
    target.children.unshift(this)
  }

  findChildIndex(child: any) {
    let index
    for (let i = 0, len = this.children.length; i < len; i++) {
      if (this.children[i] === child) {
        index = i
        break
      }
    }
    return index
  }

  private _canInsert(target: any) {
    if (this.name === 'root' || this === target) {
      return false
    }

    // cannot insert ancestor to child
    if (this.isTargetChild(target)) {
      return false
    }

    this.parent._removeChild(this)
    this.parent = target.parent
    this.pid = target.parent.id
    return true
  }

  private insertBefore(target: any) {
    if (!this._canInsert(target)) return

    const pos = target.parent.findChildIndex(target)
    target.parent.children.splice(pos, 0, this)
  }

  private insertAfter(target: any) {
    if (!this._canInsert(target)) return

    const pos = target.parent.findChildIndex(target)
    target.parent.children.splice(pos + 1, 0, this)
  }

  // findChildByClassPath(classpath: string) {
  //   let parentname = ''
  //   if (this._name !== 'root') parentname = this._name + '/'
  //   for (let i = 0, len = this.children.length; i < len; i++) {
  //     const childpath = parentname + this.children[i].name
  //     if (childpath === classpath) return this.children[i]
  //   }
  // }

  increaseChildrenCount(classpath: string, count: number) {
    const paths = classpath.split('/')
    if (this.name === 'root') {
      this._recursiveAlonePath(this, paths, 0, (node) => {
        node.count += count
      })
    } else {
      // TODO: find root then recursive from root
    }
  }
  minusChildrenCount(classpath: string, count: number) {
    const paths = classpath.split('/')
    if (this.name === 'root') {
      this._recursiveAlonePath(this, paths, 0, (node) => {
        node.count -= count
      })
    } else {
      // TODO: find root then recursive from root
    }
  }

  private _recursiveAlonePath(child: TreeNode, paths: string[], idx: number, cb: (node: TreeNode) => void) {
    for (let i = 0, len = child.children.length; i < len; i++) {
        if (child.children[i].name === paths[idx]) {
          cb(child.children[i])
          child._recursiveAlonePath(child.children[i], paths, idx + 1, cb)
          break
        }
      }
  }

  toString() {
    return JSON.stringify(traverseTree(this))
  }
}

export class Tree {
  private root: TreeNode;

  constructor(data: any) {
    this.root = new TreeNode({ name: 'root', isLeaf: false, id: 0 })
    this.initNode(this.root, data)
    // return this.root
  }

  private initNode(node: TreeNode, data: any) {
    for (let i = 0, len = data.length; i < len; i++) {
      const _data = data[i]

      const child = new TreeNode(_data)
      if (_data.children && _data.children.length > 0) {
        this.initNode(child, _data.children)
      }
      node.addChildren(child)
    }
  }

  // addChildren(children: TreeNode) {
  //   this.root.addChildren(children)
  // }

  // get name() {
  //   return this.root.name
  // }
}
