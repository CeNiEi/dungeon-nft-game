<template>
  <div style="text-align:center;">
    <canvas id="canvas" width="480"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import init from '../../YetAnotherDungeonCrawler/pkg';

onMounted(() => {
  init('http://0.0.0.0:9000/assets/YetAnotherDungeonCrawler_bg.wasm').then(
    () => {
      console.log('init wasm-pack');
    }
  );
});
</script>
