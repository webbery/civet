import { service, events } from './RendererService'
import { IPCNormalMessage } from '@/../public/IPCMessage'

export enum ConditionType {
  String = 0,
  Color = 1,
  Datetime = 2,
  ContentType = 3,
  Tag = 4,
  Class = 5
}

export enum ConditionOperation {
  Add = 0,
  Remove = 1,
  Keep = 2
}

export enum DatetimeOperator {
  Equal = 0,
  Greater = 1
}

export enum ColorOperator {
  Near = 0
}

export enum DefaultQueryName {
  Keyword = 'keyword',
  Type = 'type',
  Color = 'color',
  Class = 'class',
  Tag = 'tag',
  // AddedTime = 'addtime'
  AddedTime = 'datetime'
}

export class SearchCondition {
  type: ConditionType;
  keyword: string;
  operation: ConditionOperation;
  name: DefaultQueryName | string;
  comparation: undefined | DatetimeOperator | ColorOperator;
}

export class SearchManager {
  conditions: SearchCondition[] = [];

  constructor() {
    console.info('initialize search instance')
  }
  
  async update(conditions: SearchCondition[]) {
    for (const condition of conditions) {
      if (condition.operation === ConditionOperation.Add) {
        if(this.conditions.includes(condition)) continue
        this.conditions.push(condition)
      } else if (condition.operation === ConditionOperation.Remove) {
        this.conditions = this.conditions.filter((item) => {
          return item.keyword !== condition.keyword
        })
        console.debug(this.conditions)
      } else {  // Keep if exist, else add
        let exist = false
        for (const item of this.conditions) {
          if (item.type === ConditionType.Datetime && condition.type === ConditionType.Datetime) {
            item.keyword = condition.keyword
            break
          }
          if (condition.operation === ConditionOperation.Keep && item.keyword === condition.keyword) {
            exist = true
            break
          }
        }
        if (!exist) {
          this.conditions.push(condition)
        }
      }
    }
    console.info(`query: ${JSON.stringify(this.conditions)}`)
    const query = this.parse(this.conditions)
    return await service.get(IPCNormalMessage.QUERY_RESOURCES, query)
  }

  private parse(conditions: SearchCondition[]) {
    let query = {}
    for (const condition of conditions) {
      const name = condition.name
      switch(condition.type) {
        case ConditionType.String:
          if (!query[name]) query[name] = []
          query[name].push(condition.keyword)
          break
        case ConditionType.ContentType:
          if (!query[name]) query[name] = []
          query[name].push(condition.keyword)
          break
        case ConditionType.Datetime:
          if (condition.keyword === '*') {
            delete query[name]
          } else {
            query[name] = {$gt: condition.keyword}
          }
          break
        case ConditionType.Color:
          // if (!condition.comparation)
          query[name] = {$near: condition.keyword}
          break
        case ConditionType.Class:
          if (!query[name]) query[name] = []
          query[name].push(condition.keyword)
          break
        case ConditionType.Tag:
          query[name] = condition.keyword
          break
        default:
          break
      }
    }
    if (conditions.length === 0 || Object.keys(query).length === 0) {
      query['type'] = '*'
    }
    return query
  }
}

export const Search = new SearchManager()