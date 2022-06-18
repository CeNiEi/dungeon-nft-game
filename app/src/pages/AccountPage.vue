<template>
  <div class="text-white q-gutter-y-xl">
    <MyTitle class="text-h1" :text="['Account Balance']" />

    <div class="row justify-evenly">
      <MyTitle class="text-h3 col-3" :text="['Wrapped SOL']"/>
      <MyTitle class="text-h3 col-3" :text="['CENIEI']"/>
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
    </div>
    <div class="row justify-evenly text-h3">
        <div>
        <p>Toggle Button</p>
        <MyButton />
        </div>
    </div-->
  </div>
</template>

<script setup lang="ts">
import MyButton from 'components/MyButton.vue';
import MyTitle from 'components/MyTitle.vue'
import { useAccountStore } from '../stores/example-store';

const accountStore = useAccountStore();
accountStore.setWrappedSolBalance();

console.log(accountStore.getwrappedSolBalance);
</script>