export enum ConditionType {
  String = 0,
  Color = 1,
  Datetime = 2,
  ContentType = 3
}

export enum ConditionOperation {
  Add = 0,
  Remove = 1
}

export class SearchCondition {
  type: ConditionType;
  keyword: string;
  operation: ConditionOperation;
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
      } else {
        this.conditions = this.conditions.filter((item) => {
          return item.keyword !== condition.keyword
        })
      }
    }
    console.info(`query: ${this.conditions}`)
    // const result = await service.get(IPCNormalMessage.QUERY_RESOURCES, Cache.query)
  }
}

export const Search = new SearchManager()