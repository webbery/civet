export class Maybe<T> {
  private _value: T|null;
  private constructor(value: T|null){}

  static some<T>(value: T){
    if (!value) {
      throw Error('value should not be empty');
    }
    return new Maybe(value)
  }

  static none<T>() {
    return new Maybe<T>(null)
  }
}