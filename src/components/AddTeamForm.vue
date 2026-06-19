<template>
  <q-page padding>
    <div class="qn-form-wrap">
      <q-form
        @submit.prevent="addTeam"
        class="qn-form"
        ref="teamForm"
      >
        <q-input
          v-model="form.teamName"
          label="Team Name"
          outlined
          bg-color="white"
          class="qn-name-input col"
          :rules="[val => !!val || 'Team name is required']"
        />
        <q-btn
          type="submit"
          no-caps
          class="qn-btn qn-btn--add"
          icon="group_add"
          label="Add Team"
        />
        <q-btn
          type="button"
          no-caps
          class="qn-btn qn-btn--reset"
          icon="restart_alt"
          label="Reset All Teams"
          @click="resetTeams"
        />
      </q-form>

      <div class="q-mt-lg">
        <div class="qn-list-header qn-uppercase">Current Teams</div>
        <div
          v-for="(team, index) in scoreStore.teams"
          :key="team.id"
          class="qn-team-pill qn-pill"
        >
          <span class="qn-badge qn-team-badge">{{ index + 1 }}</span>
          <span class="qn-team-name qn-uppercase">{{ team.name }}</span>
          <q-space />
          <q-btn
            round
            dense
            color="negative"
            icon="delete"
            @click="removeTeam(team.id)"
          />
        </div>
        <div v-if="scoreStore.teams.length === 0" class="qn-empty">
          No teams added yet
        </div>
      </div>
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
  scoreStore.removeTeam(teamId)
  Notify.create({
    type: 'positive',
    message: 'Team removed successfully!',
    icon: 'check',
    position: 'top'
  })
}
</script>

<style scoped>
.qn-form-wrap {
  max-width: 720px;
  margin: 0 auto;
}

.qn-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px;
}

.qn-name-input {
  min-width: 220px;
}

.qn-btn {
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 3px solid #fff;
  border-radius: 14px;
  padding: 8px 18px;
  height: 56px;
  color: #fff;
}

.qn-btn--add {
  background-color: var(--qn-pink);
}

.qn-btn--reset {
  background-color: transparent;
}

.qn-list-header {
  color: #fff;
  font-weight: 800;
  font-size: 1rem;
  margin-bottom: 12px;
}

.qn-team-pill {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #fff;
  padding: 10px 14px;
  margin-bottom: 12px;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.18);
}

.qn-team-badge {
  width: 32px;
  height: 32px;
  font-size: 0.9rem;
  flex: none;
}

.qn-team-name {
  color: var(--qn-navy-deep);
  font-weight: 800;
  font-size: 1.05rem;
}

.qn-empty {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
  padding: 8px 4px;
}
</style>
