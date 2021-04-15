export class Result<TSuccess, TFailure>{
  private _value: TSuccess | null;
  private _error: TFailure | null;
  private constructor(value: TSuccess | null, error:TFailure | null){
    this._value = value;
    this._error = error;
  }

  static success<TSuccess, TFailure>(value: TSuccess) {
    return new Result<TSuccess, TFailure>(value, null);
  }

  static failure<TSuccess, TFailure>(error: TFailure) {
    return new Result<TSuccess, TFailure>(null, error);
  }

  fail(handle: (error: TFailure | null) => TSuccess): TSuccess {
    if (this._value === null) {
      return handle(this._error);
    } else {
      return this._value;
    }
  }

  isSuccess(): boolean {
    return this._value !== null
  }

  get value(): TSuccess|TFailure{
    if (this._value === null) return this._error!;
    return this._value!
  }
  // async ok<Ret>(f: async (wrapped: TSuccess) => Promise<Ret>): any {
  //   // if (this._value === null) {
  //   //   return Result.failure<Ret, TFailure>(this._error!);
  //   // }
  //   return Result.success<Ret, TFailure>(await f(this._value));
  // }
}