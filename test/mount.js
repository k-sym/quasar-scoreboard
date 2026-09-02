// A very small component-test harness.
//
// The project has no jsdom / happy-dom (and the test run is offline, so we
// can't add one). Vue can render into anything, though, so rather than fake a
// browser we give it a renderer that builds plain JS nodes and assert on that
// tree. Quasar components are stubbed: these tests are about ScoreBoard's own
// markup, not about QInput's internals.
import { createRenderer, defineComponent, h, nextTick } from 'vue'
import { createPinia } from 'pinia'

// Deliberately below the imports: `vue` and `pinia` must evaluate while these
// are still undefined, so neither switches into browser mode. <transition> and
// the confetti canvas do reach for them at runtime, hence the stubs.
//   - Frames are queued rather than run, and the test drives them with
//     flushFrames(). A transition needs two frames before it finishes (and
//     before <transition> actually unmounts a leaving element), while the
//     confetti loop would otherwise run forever.
//   - Zero transition durations mean whenTransitionEnds() resolves as soon as
//     those frames have been flushed, instead of waiting for a transitionend.
//   - Element exists but nothing is an instance of it, so <transition-group>
//     skips its FLIP measuring (getBoundingClientRect and friends).
const computedStyle = {
  transitionDelay: '0s',
  transitionDuration: '0s',
  animationDelay: '0s',
  animationDuration: '0s'
}
const frameQueue = []
globalThis.requestAnimationFrame = (cb) => frameQueue.push(cb)
globalThis.cancelAnimationFrame = () => {}
globalThis.getComputedStyle = () => computedStyle
globalThis.Element = class Element {}
globalThis.window = {
  innerWidth: 1280,
  innerHeight: 800,
  getComputedStyle: () => computedStyle
}

// Run the queued frames (and any they queue in turn), then let Vue re-render.
export async function flushFrames(count = 4) {
  for (let i = 0; i < count; i++) {
    frameQueue.splice(0, frameQueue.length).forEach((cb) => cb(i))
    await nextTick()
  }
}

let uid = 0

function createNode(type, tag = '') {
  const node = {
    uid: uid++,
    type, // 'element' | 'text' | 'comment'
    tag,
    text: '',
    className: '',
    props: {},
    style: {},
    parent: null,
    children: [],
    // <transition> writes its enter/leave classes straight onto the element.
    classList: {
      add: (...names) => node.transitionClasses.push(...names),
      remove: (...names) => {
        node.transitionClasses = node.transitionClasses.filter((n) => !names.includes(n))
      }
    },
    transitionClasses: [],
    ownerDocument: { body: { offsetHeight: 0 } },
    addEventListener() {},
    removeEventListener() {}
  }
  // The confetti burst grabs a 2d context; swallow everything it draws.
  if (tag === 'canvas') node.getContext = () => new Proxy({}, { get: () => () => {} })
  return node
}

function detach(node) {
  const parent = node.parent
  if (!parent) return
  const index = parent.children.indexOf(node)
  if (index > -1) parent.children.splice(index, 1)
  node.parent = null
}

function cloneNode(node) {
  const copy = createNode(node.type, node.tag)
  copy.text = node.text
  copy.className = node.className
  copy.props = { ...node.props }
  node.children.forEach((child) => {
    const childCopy = cloneNode(child)
    childCopy.parent = copy
    copy.children.push(childCopy)
  })
  return copy
}

const nodeOps = {
  createElement: (tag) => createNode('element', tag),
  createText: (text) => Object.assign(createNode('text'), { text }),
  createComment: (text) => Object.assign(createNode('comment'), { text }),
  setText: (node, text) => {
    node.text = text
  },
  setElementText: (node, text) => {
    node.children = []
    node.text = text
  },
  insert: (child, parent, anchor = null) => {
    detach(child)
    child.parent = parent
    const index = anchor ? parent.children.indexOf(anchor) : -1
    if (index > -1) parent.children.splice(index, 0, child)
    else parent.children.push(child)
  },
  remove: detach,
  parentNode: (node) => node.parent,
  nextSibling: (node) => {
    if (!node.parent) return null
    return node.parent.children[node.parent.children.indexOf(node) + 1] || null
  },
  querySelector: () => null,
  setScopeId: (node, id) => {
    node.props[id] = ''
  },
  cloneNode,
  insertStaticContent: () => [null, null]
}

function patchProp(node, key, prev, next) {
  if (key === 'class') node.className = next || ''
  else if (key === 'style') Object.assign(node.style, next || {})
  else if (next == null || next === false) delete node.props[key]
  else node.props[key] = next
}

const { createApp } = createRenderer({ ...nodeOps, patchProp })

// Stand-ins for the Quasar components ScoreBoard uses. They declare no props,
// so everything (class, onClick, model-value, ...) falls through onto the
// rendered node -- which is what the queries and interactions below read.
const stub = (name, tag) =>
  defineComponent({
    name,
    setup: (_props, { slots }) => () => h(tag, null, slots.default ? slots.default() : [])
  })

export function mount(component, plugins = [createPinia()]) {
  frameQueue.length = 0 // don't inherit a previous test's pending frames
  const root = createNode('element', 'div')
  const app = createApp(component)
  plugins.forEach((plugin) => app.use(plugin))
  app.component('QPage', stub('QPage', 'div'))
  app.component('QBtn', stub('QBtn', 'button'))
  app.component('QInput', stub('QInput', 'input'))
  app.mount(root)
  return { root, unmount: () => app.unmount() }
}

// Depth-first walk over every element node in the tree.
export function findAll(node, predicate, found = []) {
  if (node.type === 'element' && predicate(node)) found.push(node)
  node.children.forEach((child) => findAll(child, predicate, found))
  return found
}

export const findAllByClass = (node, className) =>
  findAll(node, (el) => el.className.split(/\s+/).includes(className))

export const findByClass = (node, className) => findAllByClass(node, className)[0] || null

export function textOf(node) {
  if (node.type === 'text') return node.text
  if (node.type === 'comment') return ''
  return node.text + node.children.map(textOf).join('')
}
