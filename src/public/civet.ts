export interface IFile {
  id: number;
  filename: string;
  path: string;
  filetype: string;
  meta: any;
  keyword: string[];
  category: string[];
  tag: string[];
  anno?: string[];
}

export class IFileImpl{
  id: number = 0;
  filename: string = '';
  path: string = '';
  filetype: string = '';
  meta: any;
  keyword: string[] = [];
  category: string[] = [];
  tag: string[] =[];
  anno?: string[];
  [key: string]: any;
//   constructor(property: object) {
//     IFile file;
//     Object.assign(file, property)
//     this.id = property.id;
//     this.filename = property.filename;
//     this.path = property.path;
//     this.filetype = property.filetype;
//     this.keyword = property.keyword;
//     this.category = property.category;
//     this.anno = property.anno || [];
//     this.tag = property.tag;
//     for (const item of property.meta) {
//       // console.info(item)
//       if (item.name === 'width' || item.name === 'height') {
//         this[item.name] = parseInt(item.value)
//       } else {
//         this[item.name] = item.value
//       }
//     }
//   }
}