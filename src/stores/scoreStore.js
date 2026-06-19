import { defineStore } from 'pinia'

const ROUNDS = 10

// Date.now() collides when two teams are added within the same millisecond,
// producing duplicate ids (delete one, both vanish). Use a real unique id.
function nextId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

// Load teams from localStorage, tolerating both corrupt JSON and the legacy
// shape that predates per-round jokers (teams without a `doubles` array).
function loadTeams() {
  try {
    const raw = localStorage.getItem('teams')
    const teams = raw ? JSON.parse(raw) : []
    return teams.map((team) => {
      const scores = Array.isArray(team.scores) ? team.scores : Array(ROUNDS).fill(0)
      const doubles = Array.isArray(team.doubles) ? team.doubles : Array(scores.length).fill(false)
      return { ...team, scores, doubles }
    })
  } catch {
    return []
  }
}

export const useScoreStore = defineStore('score', {
  state: () => ({
    teams: loadTeams()
  }),
  getters: {
    // Total reflects the joker: a doubled round counts twice.
    totalScore: (state) => (teamId) => {
      const team = state.teams.find((t) => t.id === teamId)
      if (!team) return 0
      return team.scores.reduce(
        (sum, score, round) => sum + score * (team.doubles[round] ? 2 : 1),
        0
      )
    },
    isDoubled: (state) => (teamId, round) => {
      const team = state.teams.find((t) => t.id === teamId)
      return team ? !!team.doubles[round] : false
    }
  },
  actions: {
    addTeam(name) {
      this.teams.push({
        id: nextId(),
        name,
        scores: Array(ROUNDS).fill(0),
        doubles: Array(ROUNDS).fill(false)
      })
      this.save()
    },
    // Stores the raw round score; doubling is applied only when totalling.
    updateScore(teamId, round, value) {
      const team = this.teams.find((t) => t.id === teamId)
      if (team) {
        team.scores[round] = Number(value) || 0
        this.save()
      }
    },
    toggleDouble(teamId, round) {
      const team = this.teams.find((t) => t.id === teamId)
      if (team) {
        team.doubles[round] = !team.doubles[round]
        this.save()
      }
    },
    removeTeam(teamId) {
      this.teams = this.teams.filter((t) => t.id !== teamId)
      this.save()
    },
    save() {
      localStorage.setItem('teams', JSON.stringify(this.teams))
    },
    resetTeams() {
      this.teams = []
      this.save()
    }
  }
})
