<template>
  <router-view v-slot="{ Component }">
    <suspense timeout="0">
      <template #default>
        <component :is="Component" :key="$route.path"></component>
      </template>
    </suspense>
  </router-view>
</template>

<script setup lang="ts">
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { initWallet } from 'solana-wallets-vue';
import 'solana-wallets-vue/styles.css';
import { initWorkspace } from './composables';

const walletOptions = {
  wallets: [new PhantomWalletAdapter()],
  autoConnect: true,
};

initWallet(walletOptions);
initWorkspace();

</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
.loading-class {
  font-family: 'Bebas Neue', sans-serif;
  color: rgb(223, 191, 191);
  font-size: xx-large;
}
.menu-font {
  font-family: 'Bebas Neue', sans-serif;
}
</style>
