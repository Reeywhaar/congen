declare module "@reeywhaar/iterator" {
  export default class Gen<T> {
    static range(max: number): Gen<number>;
    subSplit<A>(splitter: (i: T) => Generator<A>): Gen<A>;
    toArray(): T[];
  }
}
