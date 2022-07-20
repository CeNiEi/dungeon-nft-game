<template>
  <q-list bordered separator class="text-h3 text-white my-list q-gutter-y-md">
    <q-item
      clickable
      :to="{ name: 'Home' }"
      active-class="my-active-class"
      :active="$route.name === 'Home'"
    >
      <q-item-section>Home</q-item-section>
    </q-item>

    <q-item clickable :to="'Account'" active-class="my-active-class">
      <q-item-section>Account</q-item-section>
    </q-item>

    <q-item clickable>
      <q-item-section>Play</q-item-section>
    </q-item>

    <q-item clickable :to="'Admin'" active-class="my-active-class">
      <q-item-section>Admin</q-item-section>
    </q-item>
  </q-list>
  <div class="absolute-bottom">
    <WalletMultiButton />
  </div>
</template>

<script setup lang="ts">
import { WalletMultiButton } from 'solana-wallets-vue';
import MyButton from './MyButton.vue';
</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
$font-family_1: 'Bebas Neue', sans-serif;

.my-list {
  font-family: $font-family_1;
}

.my-active-class {
  color: #ff013c;
}
</style>

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
