export function debounce(func, wait, immediate) {
  var timeout;
  return function () {
    var context = this,
      args = arguments;
    var later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

export function randomInt(min = 0, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function* counter() {
  let i = 0;
  while (true) {
    yield i++;
  }
}

export function* range(max) {
  for (let i = 0; i < max; i++) {
    yield i;
  }
}

export function* gmap(it, fn) {
  for (let item of it) {
    yield fn(item);
  }
}

export function sleep(n) {
  return new Promise(resolve => setTimeout(resolve, n));
}

export function pipe(...fns) {
  return fns.reduce((c, x) => x(c));
}
