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
  conditions: any = {};

  constructor() {
    console.info('initialize search instance')
  }
  
  /**
   * Convert SearchCondition to server side query json
   * @param payload 
   * @returns 
   */
  async update(payload: SearchCondition[]|any) {
    console.info(`query begin: ${JSON.stringify(payload)}`)
    const name = payload.name
    if (name) { // if query come from view filter
      if (payload.selections.length === 0) {
        delete this.conditions[name]
      } else {
        this.conditions[name] = []
        for (const condition of payload.selections) {
          this.conditions[name].push(condition.keyword)
        }
      }
    } else { // otherwise from input search
      for (let condition of payload) {
        if (condition.operation === ConditionOperation.Remove) {
          delete this.conditions[condition.name]
        }
        else {
          this.conditions[condition.name] = condition.keyword
        }
      }
    }
    console.info(`query finish: ${JSON.stringify(this.conditions)}`)
    return await service.get(IPCNormalMessage.QUERY_RESOURCES, this.conditions)
  }
}

export const Search = new SearchManager()