<template>
  <router-view v-slot="{ Component }">
    <suspense timeout="0">
      <template #default>
        <component :is="Component" :key="$route.path"></component>
      </template>
      <template #fallback>
        <MyTitle class="text-h1" :text="['Loading...']"/>
      </template>
    </suspense>
  </router-view>
</template>

<script setup lang="ts">
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { initWallet } from 'solana-wallets-vue';
import 'solana-wallets-vue/styles.css';
import { onBeforeMount } from 'vue';
import  MyTitle  from './components/MyTitle.vue';

const walletOptions = {
  wallets: [new PhantomWalletAdapter()],
  autoConnect: true,
};

initWallet(walletOptions);
</script>
