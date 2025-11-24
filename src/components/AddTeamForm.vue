<template>
  <q-page padding>
    <q-form
      @submit.prevent="addTeam"
      class="q-gutter-md"
      ref="teamForm"
    >
      <q-input
        v-model="form.teamName"
        label="Team Name"
        outlined
        bg-color="white"
        :rules="[val => !!val || 'Team name is required']"
      />
      <q-btn type="submit" color="primary" label="Add Team" />
      <q-btn
        type="button"
        color="negative"
        label="Reset All Teams"
        @click="resetTeams"
        class="q-ml-md"
      />
    </q-form>

    <div class="q-mt-md">
      <q-list bordered class="rounded-borders">
        <q-item-label header class="team-list-header">Current Teams</q-item-label>
        <q-item
          v-for="(team, index) in scoreStore.teams"
          :key="team.id"
          class="q-my-sm"
          :class="index % 2 === 0 ? 'team-row-even' : 'team-row-odd'"
        >
          <q-item-section>
            <q-item-label class="text-white">{{ team.name }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn
              round
              dense
              color="negative"
              icon="delete"
              @click="removeTeam(team.id)"
            />
          </q-item-section>
        </q-item>
        <q-item v-if="scoreStore.teams.length === 0">
          <q-item-section>
            <q-item-label class="text-grey">No teams added yet</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useScoreStore } from 'stores/scoreStore'
import { Notify } from 'quasar'

const form = ref({
  teamName: ''
})
const scoreStore = useScoreStore()
const teamForm = ref(null)

const addTeam = () => {
  scoreStore.addTeam(form.value.teamName)
  Notify.create({
    type: 'positive',
    message: `${form.value.teamName} added successfully!`,
    icon: 'check',
    position: 'top'
  })
  form.value.teamName = ''
  teamForm.value.resetValidation()
}

const resetTeams = () => {
  scoreStore.resetTeams()
  Notify.create({
    type: 'positive',
    message: 'All teams and scores have been reset!',
    icon: 'check',
    position: 'top'
  })
}

const removeTeam = (teamId) => {
  scoreStore.teams = scoreStore.teams.filter(team => team.id !== teamId)
  scoreStore.saveToLocalStorage()
  Notify.create({
    type: 'positive',
    message: 'Team removed successfully!',
    icon: 'check',
    position: 'top'
  })
}
</script>

<style scoped>
.team-list-header {
  background-color: #e0e0e0;
  color: black;
}

.team-row-even {
  background-color: rgba(25, 118, 210, 0.7);
}

.team-row-odd {
  background-color: rgba(25, 118, 210, 0.5);
}
</style>
