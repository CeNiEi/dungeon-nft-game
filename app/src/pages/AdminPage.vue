<template>
  <div class="q-gutter-y-xl">
    <MyTitle class="text-h1" :text="['Manage Market']" />
    <div class="row justify-evenly" :style="{ cursor: 'pointer' }">
      <div
        class="col-3"
        :style="{ borderStyle: 'dotted', borderColor: 'pink' }"
      >
        <MyTitle class="text-h3" :text="['SOL Vault', `${wrappedSol}`]" />
        <q-menu
          touch-position
          auto-close
          :style="{
            background: 'linear-gradient(45deg, transparent 5%, #ff013c 5%)',
            boxShadow: '6px 0px 0px #00e6f6',
          }"
          transition-show="flip-right"
          transition-hide="flip-left"
        >
          <q-list style="min-width: 200px" class="menu-font text-center">
            <q-item v-if="wrappedSol === 'X'">
              <q-item-section>Information not availabe</q-item-section>
            </q-item>
            <q-item v-else clickable @click="copyAccount(true)">
              <q-item-section>Copy Public Key</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </div>
      <div
        class="col-3"
        :style="{ borderStyle: 'dotted', borderColor: 'pink' }"
      >
        <MyTitle class="text-h3 col-3" :text="['CENIEI Vault', `${ceniei}`]" />
        <q-menu
          auto-close
          touch-position
          :style="{
            background: 'linear-gradient(45deg, transparent 5%, #ff013c 5%)',
            boxShadow: '6px 0px 0px #00e6f6',
          }"
          transition-show="flip-right"
          transition-hide="flip-left"
        >
          <q-list style="min-width: 200px" class="menu-font text-center">
            <q-item v-if="ceniei === 'X'">
              <q-item-section>Information not availabe</q-item-section>
            </q-item>
            <q-item v-else clickable @click="copyAccount(false)">
              <q-item-section>Copy Public Key</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </div>
    </div>

    <div class="row justify-evenly">
      <MyButton :text="'Get CENIEI'" @click="fundCeniei" />
      <MyButton :text="'Add Liquidity'" @click="addLiquidity" />
    </div>
    <div class="row justify-evenly">
      <MyButton :text="'COMPLETE SETUP'" @click="setup" />
    </div>
  </div>
</template>

<script setup lang="ts">
import MyButton from 'components/MyButton.vue';
import MyTitle from 'components/MyTitle.vue';
import { ref } from 'vue';
import { useMarketStore } from '../stores/market-store';
import { useAccountStore } from '../stores/account-store';
import { useQuasar, QSpinnerHourglass } from 'quasar';

const $q = useQuasar();
const showLoading = () => {
  $q.loading.show({
    spinner: QSpinnerHourglass,
    spinnerColor: 'green',
    spinnerSize: 200,
    message: 'Please do not refresh!',
    customClass: 'loading-class',
  });
};
const hideLoading = () => {
  $q.loading.hide();
};

const marketStore = useMarketStore();
const accountStore = useAccountStore();

const wrappedSol = ref(marketStore.getSolVaultBalance);
const ceniei = ref(marketStore.getCenieiVaultBalance);

const setup = async () => {
  showLoading();
  try {
    await marketStore.createCenieiMint();

    await accountStore.createWrappedSolAta();
    await accountStore.createCenieiAta();

    await accountStore.fundWrappedSolATA();
    await marketStore.mintCeniei();

    await marketStore.createMarket();

    await marketStore.addLiquidity();

    await accountStore.setWrappedSolBalance();
    await accountStore.setCenieiBalance();

    ceniei.value = marketStore.getCenieiVaultBalance;
    wrappedSol.value = marketStore.getSolVaultBalance;
  } catch (e) {
    console.log(e);
  }
  hideLoading();
};

const fundCeniei = async () => {
  showLoading();
  try {
    await marketStore.mintCeniei();
    await accountStore.setCenieiBalance();
  } catch (e) {
    console.log(e);
  }
  hideLoading();
};

const addLiquidity = async () => {
  showLoading();
  try {
    await marketStore.addLiquidity();
    await accountStore.setCenieiBalance();
    await accountStore.setWrappedSolBalance();
    ceniei.value = marketStore.getCenieiVaultBalance;
    wrappedSol.value = marketStore.getSolVaultBalance;
  } catch (e) {
    console.log(e);
  }
  hideLoading();
};
</script>
