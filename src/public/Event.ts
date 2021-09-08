export interface Event<T> {
	(listener: (e: T) => any, thisArgs?: any): void;
}

export type Listener<T> = [(e: T) => void, any] | ((e: T) => void);

export interface IDisposable {
	dispose(): void;
}

export enum MessageState{
  UNINIT = 0,
  PENDING = 1,
  FINISH = 2
}

export class CivetProtocol {
	id: number = 0;
	version?: number;
  type: string = '';
  state: number = MessageState.UNINIT;
  tick: number = 0;   // waitting time, unit second
	msg: any;
}