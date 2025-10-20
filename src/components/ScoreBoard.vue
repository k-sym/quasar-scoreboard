<template>
  <q-page padding>
    <div class="q-mb-md">
      <q-btn
        color="primary"
        @click="sortButtonClick"
        label="^"
        icon="sort"
      />
    </div>
    <div class="scoreboard-container">
      <!-- Sticky Header Row -->
      <div class="header-row q-pa-md bg-primary text-white rounded-borders q-mb-sm">
        <div class="row items-center">
          <div class="col-3 text-h6">Team</div>
          <div class="col-7 row">
            <div
              v-for="(_, index) in scoreStore.teams[0]?.scores || []"
              :key="index"
              class="col text-center round-header"
            >
              Round {{ index + 1 }}
            </div>
          </div>
          <div class="col-2 text-h6 text-right">Total</div>
        </div>
      </div>

      <transition-group :name="sorted ? 'flip-list' : null" tag="div">
        <div
          v-for="(team, index) in sortedTeams"
          :key="team.id"
          class="team-row q-pa-md q-mb-sm bg-white shadow-2 rounded-borders"
          :class="{
            'bg-gold': index === 0 && sorted,
            'bg-silver': index === 1 && sorted
          }"
        >
          <div class="row items-center">
            <div class="col-3 text-h6">{{ team.name }}</div>
            <div class="col-7 row">
              <div
                v-for="(score, index) in team.scores"
                :key="index"
                class="col row items-center round-column"
              >
                <q-input
                  type="number"
                  :model-value="getDisplayScore(team.id, index)"
                  @update:model-value="val => updateScore(team.id, index, val)"
                  dense
                  borderless
                  min="0"
                  step="1"
                  input-class="text-center"
                  standout
                  bg-color="white"
                  class="col"
                />
                <q-btn
                  padding="6px 2px"
                  :color="isDoubleActive(team.id, index) ? 'green-6' : 'grey-2'"
                  @click="toggleDouble(team.id, index)"
                  icon="style"
                  class="q-ml-xs"
                  glossy
                />
              </div>
            </div>
            <div class="col-2 text-h6 text-right">
              <transition name="fade">
                <span v-if="sorted">{{ getTotalScore(team) }}</span>
              </transition>
            </div>
          </div>
        </div>
      </transition-group>
    </div>
  </q-page>
</template>

<script setup>
import { useScoreStore } from 'stores/scoreStore'
import { ref, watch } from 'vue'

const scoreStore = useScoreStore()
const sorted = ref(false)
const sortedTeams = ref([...scoreStore.teams])

// Track which scores are doubled
const doubledScores = ref({})

// Watch for score changes and hide totals
watch(
  () => scoreStore.teams.map(team => team.scores),
  () => {
    sorted.value = false
  },
  { deep: true }
)

const getTotalScore = (team) => {
  return team.scores.reduce((total, score, index) => {
    const multiplier = isDoubleActive(team.id, index) ? 2 : 1
    return total + (score * multiplier)
  }, 0)
}

const isDoubleActive = (teamId, round) => {
  return doubledScores.value[`${teamId}-${round}`] || false
}

const getDisplayScore = (teamId, round) => {
  const team = scoreStore.teams.find(t => t.id === teamId)
  const baseScore = team?.scores[round] || 0
  return isDoubleActive(teamId, round) ? baseScore * 2 : baseScore
}

const toggleDouble = (teamId, round) => {
  const key = `${teamId}-${round}`
  doubledScores.value[key] = !doubledScores.value[key]
}

const sortTeams = () => {
  sortedTeams.value = [...scoreStore.teams].sort((a, b) => {
    const totalA = getTotalScore(a)
    const totalB = getTotalScore(b)
    return totalB - totalA
  })
}

const updateScore = (teamId, round, value) => {
  const actualValue = isDoubleActive(teamId, round) ? value / 2 : value
  scoreStore.updateScore(teamId, round, actualValue)
}

const sortButtonClick = () => {
  sorted.value = true
  sortTeams()
}
</script>

<style scoped>
.scoreboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.header-row {
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.round-header {
  font-weight: 600;
  border-left: 1px solid rgba(255, 255, 255, 0.3);
  padding: 4px 0;
}

.round-header:first-child {
  border-left: none;
}

.round-column {
  border-left: 2px solid rgba(0, 0, 0, 0.1);
  padding-left: 8px;
}

.round-column:first-child {
  border-left: none;
  padding-left: 0;
}

.team-row {
  transition: all 1s;
  background-color: rgb(197, 217, 249);
  border: 1px solid rgba(0, 0, 0, 0.12);
  margin-bottom: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.flip-list-move {
  transition: transform 2s;
}

.bg-gold {
  background-color: gold !important;
}

.bg-silver {
  background-color: silver !important;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
