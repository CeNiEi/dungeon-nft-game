<template>
  <q-layout view="lHh Lpr lFf">
    <MyBackground />
    <q-header elevated class="custom-background text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />
        <q-toolbar-title/>
        <q-btn dense flat round icon="menu" @click="toggleRightDrawer" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" side="left" elevated class="custom-background-hor">
      <MyLeftDrawer/>
    </q-drawer>

    <q-drawer v-model="rightDrawerOpen" side="right" elevated>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import MyBackground from 'components/MyBackground.vue';
import MyLeftDrawer from 'components/MyLeftDrawer.vue';

import { ref } from 'vue';

const leftDrawerOpen = ref(false);
const rightDrawerOpen = ref(false);

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};

const toggleRightDrawer = () => {
  rightDrawerOpen.value = !rightDrawerOpen.value;
};
</script>
