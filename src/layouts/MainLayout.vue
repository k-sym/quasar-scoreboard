<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>Score Board</q-toolbar-title>
        <q-btn
          flat
          to="/"
          label="Teams"
          icon="group_add"
        />
        <q-btn
          flat
          to="/scoreboard"
          label="Board"
          icon="table_chart"
        />
      </q-toolbar>
    </q-header>

    <q-page-container style="background-color: #292d74">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
</script>
