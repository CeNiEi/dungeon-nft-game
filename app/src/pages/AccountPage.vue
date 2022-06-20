<template>
  <div class="text-white q-gutter-y-xl">
    <MyTitle class="text-h1" :text="['Account Balance']" />

    <div class="row justify-evenly">
      <div>
        <MyTitle
          class="text-h3 col-3"
          :text="['Wrapped SOL', `${wrappedSol}`]"
        />
        <q-menu auto-close>
          <q-list style="min-width: 100px">
            <q-item
              v-if="wrappedSol === 'NULL'"
              clickable
              @click="createNewSolAccount"
            >
              <q-item-section>Create New Account</q-item-section>
            </q-item>
            <q-item clickable>
              <q-item-section>Copy Public Key</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </div>
      <div>
        <MyTitle class="text-h3 col-3" :text="['CENIEI', `${ceniei}`]" />
        <q-menu auto-close>
          <q-list style="min-width: 100px">
            <q-item
              v-if="ceniei === 'NULL'"
              clickable
              @click="createNewCenieiAccount"
            >
              <q-item-section>Create New Account</q-item-section>
            </q-item>
            <q-item clickable>
              <q-item-section>Copy Public Key</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
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
import MyTitle from 'components/MyTitle.vue';
import { ref } from 'vue';
import { useAccountStore } from '../stores/account-store';
import { initWorkspace } from '../composables';

await initWorkspace();
const accountStore = useAccountStore();

const wrappedSol = ref(accountStore.getwrappedSolBalance);
const ceniei = ref(accountStore.getCenieiBalance);

if (wrappedSol.value === 'NULL') {
  await accountStore.setWrappedSolBalance();
  wrappedSol.value = accountStore.getwrappedSolBalance;
}

if (ceniei.value === 'NULL') {
  await accountStore.setCenieiBalance();
  ceniei.value = accountStore.getCenieiBalance;
}

//const createNewSolAccount = () => {
//accountStore.createWrappedSolAta().then(() => {
//solAtaCreated.value = true;
//wrappedSol.value = accountStore.getwrappedSolBalance;
//});
//};

//const createNewCenieiAccount = () => {

//accountStore.createCenieiAta().then(() => {
//cenieiAtaCreated.value = true;
//ceniei.value = accountStore.getCenieiBalance;
//});
//};
</script>
