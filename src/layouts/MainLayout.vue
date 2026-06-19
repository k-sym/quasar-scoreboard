<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="bg-navy-deep text-white">
      <q-toolbar class="q-py-sm">
        <q-toolbar-title class="qn-title qn-uppercase">Score Board</q-toolbar-title>
        <q-btn
          flat
          no-caps
          to="/"
          label="Teams"
          icon="group_add"
          class="qn-nav-btn"
          :class="{ 'qn-nav-btn--active': $route.path === '/' }"
        />
        <q-btn
          flat
          no-caps
          to="/scoreboard"
          label="Board"
          icon="table_chart"
          class="qn-nav-btn q-ml-sm"
          :class="{ 'qn-nav-btn--active': $route.path === '/scoreboard' }"
        />
      </q-toolbar>
    </q-header>

    <q-page-container class="qn-stage">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
</script>

<style scoped>
.bg-navy-deep {
  background-color: var(--qn-navy-deep);
}

.qn-title {
  font-weight: 900;
  font-size: 1.35rem;
}

.qn-nav-btn {
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 2px solid #fff;
  border-radius: 12px;
  padding: 4px 14px;
}

.qn-nav-btn--active {
  background-color: var(--qn-pink);
}
</style>
