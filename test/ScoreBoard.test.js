import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { nextTick } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { mount, flushFrames, findByClass, findAllByClass, textOf } from './mount.js'
import ScoreBoard from '../src/components/ScoreBoard.vue'
import { useScoreStore } from '../src/stores/scoreStore.js'

let pinia
let store
let mounted

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
  mounted?.unmount()
  mounted = null
})

const render = () => {
  mounted = mount(ScoreBoard, [pinia])
  return mounted.root
}

const teamId = (name) => store.teams.find((team) => team.name === name).id

// Round 1: Bees 9, Ants 5, Cats 1.
const scoreRoundOne = () => {
  store.updateScore(teamId('Ants'), 0, 5)
  store.updateScore(teamId('Bees'), 0, 9)
  store.updateScore(teamId('Cats'), 0, 1)
}

const clickRank = async (root) => {
  findByClass(root, 'qn-rank-btn').props.onClick()
  await nextTick()
  await flushFrames()
}

const rankBadges = (root) => findAllByClass(root, 'qn-rank-badge')
const teamNames = (root) => findAllByClass(root, 'qn-team-name').map(textOf)
const totals = (root) => findAllByClass(root, 'qn-total')

// Types into a round's cell the way the user does, through the QInput's
// update:model-value handler.
const typeScore = async (root, rowIndex, round, value) => {
  const rounds = store.teams[0].scores.length
  const cell = findAllByClass(root, 'qn-cell-input')[rowIndex * rounds + round]
  cell.props['onUpdate:modelValue'](value)
  await nextTick()
  // Give any transition the two frames it needs to finish, so an element that
  // is on its way out has really gone by the time we count.
  await flushFrames()
}

describe('ScoreBoard', () => {
  it('ranks the teams and reveals the totals when Rank! is pressed', async () => {
    const root = render()
    scoreRoundOne()
    await nextTick()

    expect(rankBadges(root)).toHaveLength(0)
    expect(teamNames(root)).toEqual(['Ants', 'Bees', 'Cats'])

    await clickRank(root)

    expect(rankBadges(root).map(textOf)).toEqual(['1', '2', '3'])
    expect(teamNames(root)).toEqual(['Bees', 'Ants', 'Cats'])
    expect(totals(root).map(textOf)).toEqual(['9', '5', '1'])
    expect(totals(root).every((t) => !t.className.includes('qn-total--hidden'))).toBe(true)
    expect(findAllByClass(root, 'team-row--gold')).toHaveLength(1)
    expect(findAllByClass(root, 'team-row--silver')).toHaveLength(1)
  })

  // The bug: entering round 2 used to unmount the rank badges and the totals,
  // which shrank every row and moved the input out from under the cursor.
  it('keeps the rank column when a score is changed after ranking', async () => {
    const root = render()
    scoreRoundOne()
    await nextTick()
    await clickRank(root)

    const before = rankBadges(root).map(textOf)
    expect(before).toEqual(['1', '2', '3'])

    await typeScore(root, 0, 1, '4')

    expect(store.teams.find((team) => team.name === 'Bees').scores[1]).toBe(4)
    expect(rankBadges(root)).toHaveLength(before.length)
    expect(rankBadges(root).map(textOf)).toEqual(before)
    expect(teamNames(root)).toEqual(['Bees', 'Ants', 'Cats'])
  })

  it('keeps the totals column in the layout while it is hidden', async () => {
    const root = render()

    // Before any ranking, and again while the next round is being entered, the
    // totals are hidden but still rendered so the rows keep their height.
    expect(totals(root)).toHaveLength(3)
    expect(totals(root).every((t) => t.className.includes('qn-total--hidden'))).toBe(true)

    scoreRoundOne()
    await nextTick()
    await clickRank(root)
    expect(totals(root).some((t) => t.className.includes('qn-total--hidden'))).toBe(false)

    await typeScore(root, 0, 1, '4')

    expect(totals(root)).toHaveLength(3)
    expect(totals(root).every((t) => t.className.includes('qn-total--hidden'))).toBe(true)
  })

  it('re-ranks on the next Rank! press', async () => {
    const root = render()
    scoreRoundOne()
    await nextTick()
    await clickRank(root)

    // Cats storm round 2 and take the lead.
    await typeScore(root, 2, 1, '20')
    expect(teamNames(root)).toEqual(['Bees', 'Ants', 'Cats'])

    await clickRank(root)

    expect(teamNames(root)).toEqual(['Cats', 'Bees', 'Ants'])
    expect(totals(root).map(textOf)).toEqual(['21', '9', '5'])
  })
})
