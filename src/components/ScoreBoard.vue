<template>
  <q-page padding>
    <div class="qn-toolbar q-mb-md">
      <q-btn
        no-caps
        class="qn-rank-btn"
        @click="sortButtonClick"
        icon="sort"
        label="Rank!"
      />
      <span class="qn-hint">Enter the scores, flag the jokers, then hit Rank!</span>
    </div>

    <div class="scoreboard-container">
      <!-- Sticky Header Row -->
      <div class="header-row qn-pill q-pa-md q-mb-sm">
        <div class="row items-center no-wrap">
          <div class="col-3 qn-col-label qn-uppercase">Team</div>
          <div class="col-7 row items-center justify-around no-wrap">
            <div
              v-for="(_, index) in scoreStore.teams[0]?.scores || []"
              :key="index"
              class="col flex flex-center"
            >
              <span class="qn-badge qn-round-badge">{{ index + 1 }}</span>
            </div>
          </div>
          <div class="col-2 qn-col-label qn-uppercase text-right">Total</div>
        </div>
      </div>

      <transition-group :name="ranked ? 'flip-list' : null" tag="div">
        <div
          v-for="(team, index) in sortedTeams"
          :key="team.id"
          class="team-row qn-pill q-pa-md q-mb-sm"
          :class="{
            'team-row--gold': index === 0 && ranked,
            'team-row--silver': index === 1 && ranked
          }"
        >
          <div class="row items-center no-wrap">
            <div class="col-3 row items-center no-wrap">
              <transition name="fade">
                <span
                  v-if="ranked"
                  class="qn-badge qn-rank-badge q-mr-sm"
                  :class="{
                    'qn-rank-badge--gold': index === 0,
                    'qn-rank-badge--silver': index === 1
                  }"
                >{{ index + 1 }}</span>
              </transition>
              <span class="qn-team-name qn-uppercase">{{ team.name }}</span>
            </div>
            <div class="col-7 row items-center justify-around no-wrap">
              <div
                v-for="(score, sIndex) in team.scores"
                :key="sIndex"
                class="col qn-cell"
              >
                <q-input
                  type="number"
                  :model-value="getCellValue(team.id, sIndex)"
                  @update:model-value="val => updateScore(team.id, sIndex, val)"
                  :readonly="isDoubleActive(team.id, sIndex)"
                  :class="['qn-cell-input', { 'qn-cell-input--doubled': isDoubleActive(team.id, sIndex) }]"
                  :input-class="isDoubleActive(team.id, sIndex)
                    ? 'text-center text-weight-bolder text-green-8'
                    : 'text-center'"
                  dense
                  borderless
                  min="0"
                  step="1"
                />
                <q-btn
                  round
                  dense
                  size="xs"
                  :color="isDoubleActive(team.id, sIndex) ? 'positive' : 'grey-3'"
                  :text-color="isDoubleActive(team.id, sIndex) ? 'white' : 'grey-7'"
                  @click="toggleDouble(team.id, sIndex)"
                  icon="style"
                  class="qn-joker"
                />
              </div>
            </div>
            <div class="col-2 text-right">
              <!-- Always rendered so the row keeps its height: the total is the
                   tallest thing in the row, and unmounting it used to shrink
                   every row (and the page) mid-edit. Fades instead. -->
              <span
                class="qn-total"
                :class="{ 'qn-total--hidden': !totalsVisible }"
                :aria-hidden="!totalsVisible"
              >{{ getTotalScore(team) }}</span>
            </div>
          </div>
        </div>
      </transition-group>
    </div>

    <canvas ref="confettiCanvas" class="qn-confetti"></canvas>
  </q-page>
</template>

<script setup>
import { useScoreStore } from 'stores/scoreStore'
import { ref, computed, watch } from 'vue'

const scoreStore = useScoreStore()

// Two separate flags, so entering the next round's scores never changes the
// height of the board under the host's cursor:
//   `ranked`        — the board has been ranked at least once. Stays true, so
//                     the rank badges and the medal colours survive the edits
//                     that follow (they show the *last* standings until the
//                     next Rank!, which is also why the rows don't reorder).
//                     This is deliberate, not a stale leftover: the bug
//                     report's own goal is that the rank numbers "stay
//                     visible" while the next round is entered, so hiding
//                     them here would undo the fix.
//   `totalsVisible` — the totals are live, i.e. they match what's in the cells.
//                     Editing a score hides them again until the next Rank!,
//                     but the total keeps its space in the row (see template).
const ranked = ref(false)
const totalsVisible = ref(false)
const confettiCanvas = ref(null)

// Explicit display order (by team id) so rows stay put while the host is
// entering scores, and only reshuffle when the sort button is pressed.
// Teams added after mount are appended automatically; removed teams drop out.
const displayOrder = ref(scoreStore.teams.map(team => team.id))

const sortedTeams = computed(() => {
  const byId = new Map(scoreStore.teams.map(team => [team.id, team]))
  const ordered = displayOrder.value.map(id => byId.get(id)).filter(Boolean)
  const seen = new Set(displayOrder.value)
  const extras = scoreStore.teams.filter(team => !seen.has(team.id))
  return [...ordered, ...extras]
})

// Editing a score hides the totals again until the next sort. The rank badges
// deliberately stay put: removing them shifted the whole board mid-entry.
// `updateScore` is the only action that writes to `scores`, and this
// component is its only caller, so this watch sees every score edit.
watch(
  () => scoreStore.teams.map(team => team.scores),
  () => {
    totalsVisible.value = false
  },
  { deep: true }
)

const getTotalScore = (team) => scoreStore.totalScore(team.id)
const isDoubleActive = (teamId, round) => scoreStore.isDoubled(teamId, round)

// Display only: show the doubled figure in the cell when the joker is active.
// The store always keeps the raw score, so toggling the joker off restores it
// exactly (no fractional-score corruption).
const getCellValue = (teamId, round) => {
  const team = scoreStore.teams.find(t => t.id === teamId)
  const base = team?.scores[round] || 0
  return isDoubleActive(teamId, round) ? base * 2 : base
}
const toggleDouble = (teamId, round) => scoreStore.toggleDouble(teamId, round)
const updateScore = (teamId, round, value) => scoreStore.updateScore(teamId, round, value)

const sortButtonClick = () => {
  ranked.value = true
  totalsVisible.value = true
  displayOrder.value = [...scoreStore.teams]
    .sort((a, b) => getTotalScore(b) - getTotalScore(a))
    .map(team => team.id)
  launchConfetti()
}

// Lightweight, dependency-free confetti burst when the standings are revealed.
const launchConfetti = () => {
  const canvas = confettiCanvas.value
  if (!canvas || scoreStore.teams.length === 0) return
  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  const colors = ['#f13468', '#ffd24a', '#f37b98', '#ffffff', '#2e2e86']
  const pieces = Array.from({ length: 320 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.5,
    size: 5 + Math.random() * 7,
    color: colors[Math.floor(Math.random() * colors.length)],
    vx: -1.5 + Math.random() * 3,
    vy: 1.5 + Math.random() * 2.5,
    rot: Math.random() * Math.PI,
    vr: -0.15 + Math.random() * 0.3
  }))
  let frame = 0
  const tick = () => {
    frame++
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    pieces.forEach(p => {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.035
      p.rot += p.vr
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
      ctx.restore()
    })
    if (frame < 420) {
      requestAnimationFrame(tick)
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }
  requestAnimationFrame(tick)
}
</script>

<style scoped>
.qn-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
}

.qn-rank-btn {
  background-color: var(--qn-pink);
  color: #fff;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1px;
  border: 3px solid #fff;
  border-radius: 14px;
  padding: 8px 22px;
}

.qn-hint {
  color: rgba(255, 255, 255, 0.75);
  font-weight: 600;
  font-size: 0.85rem;
}

.scoreboard-container {
  max-width: 1200px;
  margin: 0 auto;
}

.header-row {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: var(--qn-pink);
}

.qn-col-label {
  color: #fff;
  font-weight: 800;
  font-size: 0.95rem;
}

.qn-round-badge {
  width: 30px;
  height: 30px;
  font-size: 0.8rem;
}

.team-row {
  background-color: #fff;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.18);
}

.team-row--gold {
  background-color: var(--qn-gold);
}

.team-row--silver {
  background-color: var(--qn-silver);
}

.qn-team-name {
  color: var(--qn-navy-deep);
  font-weight: 800;
  font-size: 1.05rem;
}

.qn-rank-badge {
  width: 34px;
  height: 34px;
  font-size: 0.95rem;
  flex: none;
}

.qn-rank-badge--gold {
  background-color: var(--qn-gold-deep);
}

.qn-rank-badge--silver {
  background-color: var(--qn-silver-deep);
}

.qn-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
}

.qn-cell-input {
  max-width: 48px;
}

.qn-cell-input :deep(.q-field__control) {
  background: #f2f3fb;
  border: 2px solid #d9dcef;
  border-radius: 9px;
  height: 34px;
  min-height: 34px;
  padding: 0 2px;
}

.qn-cell-input :deep(.q-field__native) {
  padding: 0;
  min-height: 0;
}

.qn-cell-input :deep(.q-field__control)::before,
.qn-cell-input :deep(.q-field__control)::after {
  display: none;
}

.qn-cell-input :deep(input) {
  color: var(--qn-navy-deep);
  font-weight: 800;
}

.qn-cell-input--doubled :deep(.q-field__control) {
  background: #e6f6ec;
  border-color: var(--qn-bonus);
}

.qn-joker {
  flex: none;
}

.qn-total {
  display: inline-block;
  font-weight: 900;
  font-size: 1.7rem;
  color: var(--qn-navy-deep);
  letter-spacing: -0.5px;
  transition: opacity 0.5s;
}

/* Hidden, not unmounted — the row must keep the same height either way. */
.qn-total--hidden {
  opacity: 0;
}

.qn-confetti {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 9999;
}

/* Bouncy reorder when the standings are revealed. */
.flip-list-move {
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
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
