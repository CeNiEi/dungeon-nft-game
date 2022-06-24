<template>
  <MyButton :text="'Admin'" :path="'Admin'" />
  <div class="absolute-bottom">
    <WalletMultiButton />
  </div>
</template>

<script setup lang="ts">
import { WalletMultiButton } from 'solana-wallets-vue';
import MyButton from './MyButton.vue';

//import { useAccountStore } from '../stores/account-store.ts';
//import { useMarketStore } from '../stores/market-store.ts';
//
//const accountStore = useAccountStore();
//const marketStore = useMarketStore();
</script>

<style lang="scss">
.swv-dropdown {
  width: 100%;
}

.swv-button {
  width: 100%;
  border-radius: 0px;
}

.swv-button-trigger {
  background-color: #ff013c;
  justify-content: center;
}

.swv-button:not([disabled]):hover {
  background-color: $secondary;
}
</style>
