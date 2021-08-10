import { ContentItemSelectedEvent, ResourceProperty, IResource } from 'civet'

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

export class ExtResourceProperty implements ResourceProperty {
  name: string;
  type: PropertyType;
  query: boolean;
  store: boolean;
  value: any;
}

export class ExtContentItemSelectedEvent implements ContentItemSelectedEvent {
  items: IResource[] = [];
}