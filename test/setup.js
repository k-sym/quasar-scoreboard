// Minimal in-memory localStorage so the store can be tested under Node
// without pulling in jsdom/happy-dom.
const store = new Map()

globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear()
}
