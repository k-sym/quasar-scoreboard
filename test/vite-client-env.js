// Vitest's `node` environment asks Vite to transform modules in SSR mode, and
// in SSR mode a .vue file compiles to an `ssrRender` HTML-string builder that
// can't be mounted. This is the plain node environment (no browser globals
// added), tagged so Vite uses the client transform for component tests.
export default {
  name: 'vite-client',
  viteEnvironment: 'client',
  setup() {
    return {
      teardown() {}
    }
  }
}
