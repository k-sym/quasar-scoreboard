import { defineStore } from 'pinia'

export const useScoreStore = defineStore('score', {
  state: () => ({
    teams: JSON.parse(localStorage.getItem('teams')) || []
  }),
  actions: {
    addTeam(name) {
      this.teams.push({
        id: Date.now(),
        name,
        scores: Array(10).fill(0)
      })
      this.saveToLocalStorage()
    },
    updateScore(teamId, round, value) {
      const team = this.teams.find(t => t.id === teamId)
      if (team) {
        team.scores[round] = Number(value) || 0
        this.saveToLocalStorage()
      }
    },
    saveToLocalStorage() {
      localStorage.setItem('teams', JSON.stringify(this.teams))
    },
    resetTeams() {
      this.teams = []
      this.saveToLocalStorage()
    }
  },
  getters: {
    totalScore: (state) => (teamId) => {
      const team = state.teams.find(t => t.id === teamId)
      return team ? team.scores.reduce((a, b) => a + b, 0) : 0
    }
  }
})
