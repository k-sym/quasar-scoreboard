import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ScoreBoard from '../src/components/ScoreBoard.vue'
import { useScoreStore } from '../src/stores/scoreStore.js'

// Quasar's components are stubbed: these tests are about ScoreBoard's own
// markup and behaviour, not about QInput's internals. The stubs keep the
// contract the board actually uses — a real <input> that emits
// `update:model-value` as you type, and a real <button> that clicks.
const QInput = defineComponent({
  name: 'QInput',
  inheritAttrs: false,
  props: { modelValue: { type: [String, Number], default: '' } },
  emits: ['update:modelValue'],
  setup(props, { emit, attrs }) {
    return () =>
      h('input', {
        ...attrs,
        value: props.modelValue,
        onInput: (event) => emit('update:modelValue', event.target.value)
      })
  }
})

const passthrough = (name, tag) =>
  defineComponent({
    name,
    setup: (_props, { slots }) => () => h(tag, null, slots.default ? slots.default() : [])
  })

let pinia
let store
let wrapper

beforeEach(() => {
  localStorage.clear()
  pinia = createPinia()
  setActivePinia(pinia)
  store = useScoreStore()
  store.addTeam('Ants')
  store.addTeam('Bees')
  store.addTeam('Cats')
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

const render = () => {
  wrapper = mount(ScoreBoard, {
    global: {
      plugins: [pinia],
      stubs: { QPage: passthrough('QPage', 'div'), QBtn: passthrough('QBtn', 'button'), QInput }
    }
  })
  return wrapper
}

const teamId = (name) => store.teams.find((team) => team.name === name).id

// Round 1: Bees 9, Ants 5, Cats 1.
const scoreRoundOne = () => {
  store.updateScore(teamId('Ants'), 0, 5)
  store.updateScore(teamId('Bees'), 0, 9)
  store.updateScore(teamId('Cats'), 0, 1)
}

const clickRank = () => wrapper.get('.qn-rank-btn').trigger('click')

const rankBadges = () => wrapper.findAll('.qn-rank-badge').map((el) => el.text())
const teamNames = () => wrapper.findAll('.qn-team-name').map((el) => el.text())
const totals = () => wrapper.findAll('.qn-total')
const hiddenTotals = () => totals().filter((el) => el.classes('qn-total--hidden'))

// Types into a round's cell the way the host does.
const typeScore = (rowIndex, round, value) => {
  const rounds = store.teams[0].scores.length
  return wrapper.findAll('.qn-cell-input')[rowIndex * rounds + round].setValue(value)
}

describe('ScoreBoard', () => {
  it('ranks the teams and reveals the totals when Rank! is pressed', async () => {
    render()
    scoreRoundOne()
    await nextTick()

    expect(rankBadges()).toEqual([])
    expect(teamNames()).toEqual(['Ants', 'Bees', 'Cats'])

    await clickRank()

    expect(rankBadges()).toEqual(['1', '2', '3'])
    expect(teamNames()).toEqual(['Bees', 'Ants', 'Cats'])
    expect(totals().map((el) => el.text())).toEqual(['9', '5', '1'])
    expect(hiddenTotals()).toHaveLength(0)
    expect(wrapper.findAll('.team-row--gold')).toHaveLength(1)
    expect(wrapper.findAll('.team-row--silver')).toHaveLength(1)
  })

  // The bug: entering round 2 used to unmount the rank badges and the totals,
  // which shrank every row and moved the input out from under the cursor.
  it('keeps the rank column when a score is changed after ranking', async () => {
    render()
    scoreRoundOne()
    await nextTick()
    await clickRank()

    expect(rankBadges()).toEqual(['1', '2', '3'])

    await typeScore(0, 1, '4')

    expect(store.teams.find((team) => team.name === 'Bees').scores[1]).toBe(4)
    expect(rankBadges()).toEqual(['1', '2', '3'])
    expect(teamNames()).toEqual(['Bees', 'Ants', 'Cats'])
  })

  it('keeps the totals column in the layout while it is hidden', async () => {
    render()

    // Before any ranking, and again while the next round is being entered, the
    // totals are hidden but still rendered so the rows keep their height.
    expect(totals()).toHaveLength(3)
    expect(hiddenTotals()).toHaveLength(3)

    scoreRoundOne()
    await nextTick()
    await clickRank()
    expect(hiddenTotals()).toHaveLength(0)

    await typeScore(0, 1, '4')

    expect(totals()).toHaveLength(3)
    expect(hiddenTotals()).toHaveLength(3)
  })

  it('re-ranks on the next Rank! press', async () => {
    render()
    scoreRoundOne()
    await nextTick()
    await clickRank()

    // Cats storm round 2 and take the lead.
    await typeScore(2, 1, '20')
    expect(teamNames()).toEqual(['Bees', 'Ants', 'Cats'])

    await clickRank()

    expect(teamNames()).toEqual(['Cats', 'Bees', 'Ants'])
    expect(totals().map((el) => el.text())).toEqual(['21', '9', '5'])
  })

  // The team list changing means the standings are about a different board.
  // `ranked` is sticky across score edits on purpose; it must NOT be sticky
  // across these, or a fresh game inherits the last one's rosette.
  it('drops the ranking when the teams are reset and a new game starts', async () => {
    render()
    scoreRoundOne()
    await nextTick()
    await clickRank()
    expect(rankBadges()).toHaveLength(3)

    store.resetTeams()
    store.addTeam('Dogs')
    store.addTeam('Emus')
    await nextTick()

    // Nobody has pressed Rank! in this game.
    expect(rankBadges()).toEqual([])
    expect(wrapper.findAll('.team-row--gold')).toHaveLength(0)
    expect(hiddenTotals()).toHaveLength(2)
  })

  it('drops the ranking when a team joins after the last Rank!', async () => {
    render()
    scoreRoundOne()
    await nextTick()
    await clickRank()

    store.addTeam('Dogs')
    await nextTick()

    // A late arrival must not be handed a place it never played for.
    expect(rankBadges()).toEqual([])
    expect(teamNames()).toEqual(['Bees', 'Ants', 'Cats', 'Dogs'])
  })

  it('drops the ranking when the leader is removed', async () => {
    render()
    scoreRoundOne()
    await nextTick()
    await clickRank()

    store.removeTeam(teamId('Bees'))
    await nextTick()

    // Ants was second on 5; promoting it to gold is a standing nobody set.
    expect(wrapper.findAll('.team-row--gold')).toHaveLength(0)
    expect(rankBadges()).toEqual([])
  })
})
