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
}
