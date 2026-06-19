import { beforeEach, describe, it, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useScoreStore } from '../src/stores/scoreStore.js'

const ROUNDS = 10

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
})

describe('scoreStore', () => {
  it('creates a team with a full row of zeroed scores and no jokers', () => {
    const store = useScoreStore()
    store.addTeam('Quizzards')

    const team = store.teams[0]
    expect(team.name).toBe('Quizzards')
    expect(team.scores).toEqual(Array(ROUNDS).fill(0))
    expect(team.doubles).toEqual(Array(ROUNDS).fill(false))
  })

  it('stores the raw round score, not a doubled value', () => {
    const store = useScoreStore()
    store.addTeam('A')
    const id = store.teams[0].id

    store.updateScore(id, 0, 7)
    store.toggleDouble(id, 0)

    // The cell value stays the raw score; only the total reflects the joker.
    expect(store.teams[0].scores[0]).toBe(7)
    expect(store.totalScore(id)).toBe(14)
  })

  it('sums scores with a 2x multiplier on jokered rounds', () => {
    const store = useScoreStore()
    store.addTeam('A')
    const id = store.teams[0].id

    store.updateScore(id, 0, 5)
    store.updateScore(id, 1, 3)
    store.toggleDouble(id, 1)

    expect(store.totalScore(id)).toBe(5 + 3 * 2)
  })

  it('persists jokers across a reload (the original corruption bug)', () => {
    const first = useScoreStore()
    first.addTeam('A')
    const id = first.teams[0].id
    first.updateScore(id, 0, 10)
    first.toggleDouble(id, 0)
    expect(first.totalScore(id)).toBe(20)

    // Simulate a page reload: brand new pinia + store reads from localStorage.
    setActivePinia(createPinia())
    const reloaded = useScoreStore()

    expect(reloaded.totalScore(id)).toBe(20)
    expect(reloaded.isDoubled(id, 0)).toBe(true)
  })

  it('migrates legacy teams that have no doubles array', () => {
    localStorage.setItem(
      'teams',
      JSON.stringify([{ id: 1, name: 'Legacy', scores: [4, 0, 0] }])
    )
    setActivePinia(createPinia())

    const store = useScoreStore()
    expect(store.totalScore(1)).toBe(4)
    expect(store.isDoubled(1, 0)).toBe(false)
  })

  it('removes a team and persists the removal', () => {
    const store = useScoreStore()
    store.addTeam('A')
    store.addTeam('B')
    const idA = store.teams[0].id

    store.removeTeam(idA)
    expect(store.teams).toHaveLength(1)
    expect(store.teams[0].name).toBe('B')
  })
})
