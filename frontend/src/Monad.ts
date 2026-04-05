type MonadValue<U> = U extends Monad<infer R> ? MonadValue<R> : U;

export class Monad<T> {
  value: T;

  constructor(val: T) {
    this.value = val;
  }

  map<U>(fn: (val: T) => U): Monad<U> {
    return new Monad<U>(fn(this.value));
  }

  flatMap<U>(fn: (val: T) => U): Monad<MonadValue<U>> {
    let val = fn(this.value);
    while (val instanceof Monad) {
      val = val.value;
    }
    return new Monad(val as MonadValue<U>);
  }

  flatten() {
    return this.flatMap((v) => v);
  }
}
