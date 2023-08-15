import { PRNG } from "seedrandom";

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false,
): (...args: Parameters<T>) => void {
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
  return new Promise((resolve) => setTimeout(resolve, n));
}

export function ensureType<T>(v: T): T {
  return v;
}

export const createSortHandler = <T extends any>(
  weightsExtractor: (a: T) => number[],
) => {
  const cache = new Map<T, number[]>();
  return (a: T, b: T) => {
    if (!cache.has(a)) cache.set(a, weightsExtractor(a));
    if (!cache.has(b)) cache.set(b, weightsExtractor(b));

    const ak = cache.get(a)!;
    const bk = cache.get(b)!;

    for (let i = 0; i < ak.length; i++) {
      const p1 = ak[i];
      const p2 = bk[i];
      const r = p2 - p1;
      if (r !== 0) return r;
    }

    return 0;
  };
};

export function promptImage() {
  return new Promise<File | null>((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      if (input.files && input.files.length > 0) {
        resolve(input.files[0]);
      } else {
        resolve(null);
      }
      document.body.removeChild(input);
    };

    input.hidden = true;
    document.body.appendChild(input);

    input.click();
  });
}

export function readImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => {
      if (image.width === 0 || image.height === 0) {
        reject(new Error(`Unable to get image ${url}`));
        return;
      }
      resolve(image);
    });
    image.addEventListener("error", (e) => {
      reject(new Error(`Unable to get image ${url}`));
    });
    image.src = url;
    setTimeout(() => {
      reject(new Error(`Unable to get image ${url}`));
    }, 2000);
  });
}
