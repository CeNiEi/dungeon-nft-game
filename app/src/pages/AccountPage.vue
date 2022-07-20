<template>
  <div class="q-gutter-y-xl">
    <MyTitle class="text-h1" :text="['Account Details']" />

    <div class="row justify-evenly" :style="{ cursor: 'pointer' }">
      <div
        class="col-3"
        :style="{ borderStyle: 'dotted', borderColor: 'pink' }"
      >
        <MyTitle class="text-h3" :text="['Wrapped SOL', `${wrappedSol}`]" />
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
        <MyTitle class="text-h3 col-3" :text="['CENIEI', `${ceniei}`]" />
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
      <div class="col-3">
        <div v-if="wrappedSol === 'X'">
          <MyButton :text="'New Account'" @click="createNewSolAccount" />
        </div>
        <div v-else class="q-gutter-y-md">
          <MyButton :text="'Convert To CENIEI'" @click="convertToCeniei" />
          <MyButton :text="'Fund Account'" @click="fundSolAccount" />
          <MyButton :text="'Get Back'" />
        </div>
      </div>
      <div class="col-3">
        <div v-if="ceniei === 'X'">
          <MyButton :text="'New Account'" @click="createNewCenieiAccount" />
        </div>
        <div v-else>
          <MyButton :text="'Convert To SOL'" />
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
              <q-item clickable @click="convertToSol(true)">
                <q-item-section>Full</q-item-section>
              </q-item>
              <q-item clickable @click="convertToSol(false)">
                <q-item-section>Half</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MyButton from 'components/MyButton.vue';
import MyTitle from 'components/MyTitle.vue';
import { ref } from 'vue';
import { useAccountStore } from '../stores/account-store';
import { useMarketStore } from '../stores/market-store';
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

const accountStore = useAccountStore();
const marketStore = useMarketStore();

const wrappedSol = ref(accountStore.getWrappedSolBalance);
const ceniei = ref(accountStore.getCenieiBalance);

if (wrappedSol.value === 'X') {
  showLoading();
  try {
    await accountStore.setWrappedSolBalance();
    wrappedSol.value = accountStore.getWrappedSolBalance;
  } catch (e) {
    console.log(e);
  }
  hideLoading();
}

if (ceniei.value === 'X') {
  showLoading();
  try {
    await accountStore.setCenieiBalance();
    ceniei.value = accountStore.getCenieiBalance;
  } catch (e) {
    console.log(e);
  }
  hideLoading();
}

const convertToCeniei = async () => {
  showLoading();
  await marketStore.convertSolToCeniei().catch((e) => console.log(e));
  await accountStore.setWrappedSolBalance();
  await accountStore.setCenieiBalance();
  wrappedSol.value = accountStore.getWrappedSolBalance;
  ceniei.value = accountStore.getCenieiBalance;
  hideLoading();
};

const convertToSol = async (full: boolean) => {
  showLoading();
  await marketStore.convertCenieiToSol(full).catch((e) => console.log(e));
  await accountStore.setWrappedSolBalance();
  await accountStore.setCenieiBalance();
  wrappedSol.value = accountStore.getWrappedSolBalance;
  ceniei.value = accountStore.getCenieiBalance;
  hideLoading();
};

// MAKE SURE TO CHECK IF THE ACCOUNT EXISTS BEFORE CREATING IT
// IN CASE THE WALLET TRANSACTION FAILS
const createNewSolAccount = async () => {
  showLoading();
  try {
    await accountStore.setWrappedSolBalance();
    if (accountStore.getWrappedSolBalance === 'X') {
      await accountStore.createWrappedSolAta();
    }
    wrappedSol.value = accountStore.getWrappedSolBalance;
  } catch (e) {
    console.log(e);
  }
  hideLoading();
};

// MAKE SURE TO CHECK IF THE ACCOUNT EXISTS BEFORE CREATING IT
// IN CASE THE WALLET TRANSACTION FAILS
const createNewCenieiAccount = async () => {
  showLoading();
  try {
    await accountStore.setCenieiBalance();
    if (accountStore.getCenieiBalance === 'X') {
      await accountStore.createCenieiAta();
    }
    ceniei.value = accountStore.getCenieiBalance;
  } catch (e) {
    console.log(e);
  }
  hideLoading();
};

const fundSolAccount = async () => {
  showLoading();
  try {
    await accountStore.fundWrappedSolATA();
    await accountStore.setWrappedSolBalance();
    wrappedSol.value = accountStore.getWrappedSolBalance;
  } catch (e) {
    console.log(e);
  }
  hideLoading();
};

const copyAccount = (sol: boolean) => {
  const text = sol
    ? accountStore.getWrappedSolAccount
    : accountStore.getCenieiAccount;
  navigator.clipboard.writeText(text);
};
</script>
