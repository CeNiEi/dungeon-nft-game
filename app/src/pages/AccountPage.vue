<template>
  <div class="text-white q-gutter-y-xl">
    <MyTitle :text="['Current Balance']" />
    <div class="row justify-evenly text-h6">
      <div>
        <p>Token -> 9999</p>
      </div>
      <div>
        <p>Sol -> 99</p>
      </div>
    </div>
    <!--div class="row justify-evenly text-h5">
      <div>
        <p>SOL</p>
        <MyButton/>
      </div>
      <div>
        <p>Token</p>
        <MyButton/>
      </div>
    </div-->
    <div class="row justify-evenly text-h3">
      <div>
        <p>Toggle Button</p>
        <MyButton />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MyButton from 'components/MyButton.vue';
import MyTitle from 'components/MyTitle.vue';

import { getATA } from '../api';

getATA(true);
getATA(false);
</script>