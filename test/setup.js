// Node ships its own experimental `localStorage` global, disabled unless the
// process is started with --localstorage-file, and it shadows the one happy-dom
// puts on the window. Rather than pass a flag to every test runner, the store
// keeps the in-memory stand-in it has always had.
const store = new Map()

globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear()
}

// happy-dom has no 2D canvas context, and the confetti burst on Rank! would
// call clearRect on null. Nothing asserts on the confetti; it just must not
// throw. The burst then animates for 420 frames, which would keep the run's
// timers busy for seconds after every ranking test, so frames are dropped too.
const noop = new Proxy({}, { get: () => () => {} })
globalThis.HTMLCanvasElement.prototype.getContext = () => noop
globalThis.requestAnimationFrame = () => 0
globalThis.cancelAnimationFrame = () => {}
