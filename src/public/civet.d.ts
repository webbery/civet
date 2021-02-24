<<<<<<< HEAD
declare module 'civet' {

  export const version: string;
  
  export interface IFile {
    readonly id: number;
    readonly type: string;
    readonly name: string;

    path: string[];
    meta: JSON;
    tag: string[];
    category: string[];
    anno?: string[];
    keyword: string[];
    [propName: string]: any;

    read(path: string): Thenable<boolean>;
    write(path: string): Thenable<boolean>;
  }

  export interface FileReadEvent{
    onRead(path: string): void;
  }

  export interface IDatabase {
    addFiles(path: string[]): Thenable<boolean>;
    removeFiles(ids: number[]): Thenable<boolean>;
    updateFilesKeywords(ids: number[], keywords: string[]): Thenable<boolean>;
    setTags(ids: number[], tags: string[]): Thenable<boolean>;
    removeTags(ids: number[], tags: string[]): Thenable<boolean>;
    addClasses(path: string[]): Thenable<boolean>;
    addClasses(ids: number[], path: string[]): Thenable<boolean>;
    removeClasses(path: string[]): Thenable<boolean>;
    updateFile(meta: object): Thenable<boolean>;
    updateClassName(oldPath: string, newPath: string): Thenable<boolean>;
  }

  export interface IRegistEvent {
  }

  export interface IFilePaser {
    // onParse(stream: Stream): Thenable<boolean>;
  }

  interface Thenable<T> {
    then<TResult>(onfulfilled?: (value: T) => TResult | Thenable<TResult>, onrejected?: (reason: any) => TResult | Thenable<TResult>): Thenable<TResult>;
    then<TResult>(onfulfilled?: (value: T) => TResult | Thenable<TResult>, onrejected?: (reason: any) => void): Thenable<TResult>;
  }
=======
interface IFile {
  id: number;
  type: string;
  meta: JSON;
  tag: string[];
  category: string[];
  anno?: string[];
  keyword: string[];
}

interface IFileEvent {
  onReadEvent: (stream: JSON) => boolean;
  onWriteEvent: () => boolean;
>>>>>>> 1dc7daa... update ci; add part of ts files for extension
}
