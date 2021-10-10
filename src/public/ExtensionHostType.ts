import * as civet from 'civet'

export enum PropertyType {
  String = 1,
  Number = 2,
  Binary = 4,
  Score = 5,
  Datetime = 6
}

export enum ViewType {
  Property = 1,
  Navigation = 2,
  Overview = 3,
  DetailView = 4,
  Search = 5
}

export enum OverviewItemLayout {
  WaterFall = 0,
  Grid = 1,
  Row = 2,
  Custom = 3
}

export enum ScrollType {
  None = 0,
  Horizon = 1,
  Vertical = 2
}

export enum OverviewItemType {
  Resource = 0,
  Class = 1
}

export class ExtResourceProperty implements civet.ResourceProperty {
  name: string;
  type: PropertyType;
  query: boolean;
  store: boolean;
  value: any;
}

export class ExtContentItemSelectedEvent implements civet.ContentItemSelectedEvent {
  items: civet.IResource[] = [];
}

export class ExtClassItem implements civet.ClassItem {
  name: string;
  path?: string;
}

export class ExtOverviewItemLoadEvent implements civet.OverviewItemLoadEvent {
  resources: civet.IResource[];
  classes: civet.ClassItem[];
}

export class ExtOverviewVisibleRangesChangeEvent implements civet.OverviewVisibleRangesChangeEvent {
  view: civet.OverView;
  scroll: ScrollType;
  percent: number;
}