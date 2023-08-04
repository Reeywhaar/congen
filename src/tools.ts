import { PRNG } from "seedrandom";

export function debounce<T extends (...args: any[]) => any>(func: T, wait: number, immediate: boolean = false): (...args: Parameters<T>) => void {
  var timeout: ReturnType<typeof setTimeout> | null = null;
  return function () {
    var context = this,
      args = arguments;
    var later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout!);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

export function randomInt(min: number, max: number, rng?: () => number) {
  const rand = rng ? rng() : Math.random();
  return Math.floor(rand * (max - min + 1)) + min;
}

export function* counter() {
  let i = 0;
  while (true) {
    yield i++;
  }
}

export function* range(max: number) {
  for (let i = 0; i < max; i++) {
    yield i;
  }
}

export function* gmap<T, B>(it: IterableIterator<T>, fn: (x: T) => B) {
  for (let item of it) {
    yield fn(item);
  }
}

export function sleep(n: number) {
  return new Promise(resolve => setTimeout(resolve, n));
}

type AnyFunc = (...arg: any) => any;

type LastFnReturnType<F extends Array<AnyFunc>, Else = never> = F extends [
  ...any[],
  (...arg: any) => infer R
]
  ? R
  : Else;

type PipeArgs<F extends AnyFunc[], Acc extends AnyFunc[] = []> = F extends [
  (...args: infer A) => infer B
]
  ? [...Acc, (...args: A) => B]
  : F extends [(...args: infer A) => any, ...infer Tail]
  ? Tail extends [(arg: infer B) => any, ...any[]]
  ? PipeArgs<Tail, [...Acc, (...args: A) => B]>
  : Acc
  : Acc;

export function pipe<FirstFn extends AnyFunc, F extends AnyFunc[]>(
  arg: Parameters<FirstFn>[0],
  firstFn: FirstFn,
  ...fns: PipeArgs<F> extends F ? F : PipeArgs<F>
): LastFnReturnType<F, ReturnType<FirstFn>> {
  return (fns as AnyFunc[]).reduce((acc, fn) => fn(acc), firstFn(arg));
}

export function ensureType<T>(v: T): T {
  return v;
}