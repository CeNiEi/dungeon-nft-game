<template>
  <router-view />
</template>

<script setup lang="ts">
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { initWallet } from 'solana-wallets-vue';
import 'solana-wallets-vue/styles.css';
import { initWorkspace }  from './composables';

const walletOptions = {
  wallets: [new PhantomWalletAdapter()],
  autoConnect: true,
};

initWallet(walletOptions);
initWorkspace();


</script>