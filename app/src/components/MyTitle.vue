<template>
  <div>
    <div class="container" v-for="(word, index) in text" :key="index">
      <div class="glitch">{{word}}</div>
      <div class="glitch-before">{{word}}</div>
      <div class="glitch-after">{{word}}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  text: Array<string>
}>();
</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css?family=Oswald');

.container {
  font-family: 'Oswald', sans-serif;
  font-style: italic;
  position: relative;
  text-align: center;
}

.glitch {
  color: rgb(223, 191, 191);
  position: relative;
  animation: glitch 5s 5s infinite;
}

.glitch-before {
  content: attr(data-text);
  text-shadow: -0.5vw 0 magenta;
  position: absolute;
  width: 100%;
  background: $primary;
  position: absolute;
  overflow: hidden;
  top: 0%;
  animation: noise-1 3s linear infinite alternate-reverse, glitch 5s 5s infinite;
}

.glitch-after {
  content: attr(data-text);
  text-shadow: -0.5vw 0 lightgreen;
  position: absolute;
  top: 0;
  width: 100%;
  background: $primary;
  overflow: hidden;
  animation: noise-2 3s linear infinite alternate-reverse, glitch 5s 5s infinite;
}

@keyframes glitch {
  1% {
    transform: rotateX(10deg) skewX(90deg);
  }
  2% {
    transform: rotateX(0deg) skewX(0deg);
  }
}

@keyframes noise-1 {
  $steps: 30;
  @for $i from 1 through $steps {
    #{percentage($i*(1/$steps))} {
      $top: random(100);
      $bottom: random(101 - $top);
      clip-path: inset(#{$top}px 0 #{$bottom}px 0);
    }
  }
}

@keyframes noise-2 {
  $steps: 30;
  @for $i from 0 through $steps {
    #{percentage($i*(1/$steps))} {
      $top: random(100);
      $bottom: random(101 - $top);
      clip-path: inset(#{$top}px 0 #{$bottom}px 0);
    }
  }
}
</style>