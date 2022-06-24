<template>
  <q-page>
    <MyTitle class="text-h1" :text="['TOKEN', 'HUNTER']" />
    <div class="row justify-evenly custom-pos">
      <MyButton :text="'Account'" :path="'Account'" />
      <MyButton :text="'Play'" :path="'Play'" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import MyButton from 'components/MyButton.vue';
import MyTitle from 'components/MyTitle.vue';
import { initWorkspace } from '../composables';

initWorkspace();
</script>

<style lang="scss" scoped>
.custom-pos {
  margin-top: 10%;
}
</style>
