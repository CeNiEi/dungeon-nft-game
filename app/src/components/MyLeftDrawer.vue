<template>
  <div class="absolute-bottom">
    <WalletMultiButton />
  </div>
</template>

<script setup lang="ts">
import { WalletMultiButton } from 'solana-wallets-vue';
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