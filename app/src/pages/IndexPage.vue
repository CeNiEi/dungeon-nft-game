<template>
  <q-page>
    <MyTitle />
    <div class="row justify-evenly custom-pos">
      <MyButton :text="'Account'" />
      <MyButton :text="'Play'" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import MyButton from 'components/MyButton.vue';
import MyTitle from 'components/MyTitle.vue';
</script>

<style lang="scss" scoped>
.custom-pos {
  margin-top: 10%;
}
</style>