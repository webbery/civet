export interface Event<T> {
	(listener: (e: T) => any, thisArgs?: any): void;
}