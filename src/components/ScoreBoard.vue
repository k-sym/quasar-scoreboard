<template>
  <q-page padding>
    <div class="q-mb-md">
      <q-btn
        color="primary"
        @click="sortButtonClick"
        label="S"
        icon="sort"
      />
    </div>
    <div class="scoreboard-container">
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
                class="col"
              >
                <q-input
                  type="number"
                  :model-value="score"
                  @update:model-value="val => updateScore(team.id, index, val)"
                  dense
                  borderless
                  min="0"
                  step="1"
                  input-class="text-right"
                  standout
                  bg-color="white"
                />
              </div>
            </div>
            <div class="col-2 text-h6 text-right">
              {{ scoreStore.totalScore(team.id) }}
            </div>
          </div>
        </div>
      </transition-group>
    </div>
  </q-page>
</template>

<script setup>
import { useScoreStore } from 'stores/scoreStore'
import { ref } from 'vue'

const scoreStore = useScoreStore()
const sorted = ref(false)
const sortedTeams = ref([...scoreStore.teams])

const sortTeams = () => {
  sortedTeams.value = [...scoreStore.teams].sort((a, b) => {
    const totalA = scoreStore.totalScore(a.id)
    const totalB = scoreStore.totalScore(b.id)
    return totalB - totalA
  })
}

const updateScore = (teamId, round, value) => {
  scoreStore.updateScore(teamId, round, value)
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
}

.team-row {
  transition: all 1s;
  background-color: rgb(197, 217, 249);
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
</style>
