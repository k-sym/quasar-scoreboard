<template>
  <q-page padding>
    <q-form @submit.prevent="addTeam" class="q-gutter-md">
      <q-input
        v-model="teamName"
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
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useScoreStore } from 'stores/scoreStore'
import { Notify } from 'quasar'

const teamName = ref('')
const scoreStore = useScoreStore()

const addTeam = () => {
  scoreStore.addTeam(teamName.value)
  Notify.create({
    type: 'positive',
    message: `${teamName.value} added successfully!`,
    icon: 'check',
    position: 'top'
  })
  teamName.value = ''
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
</script>
