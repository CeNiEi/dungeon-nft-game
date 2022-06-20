import { defineStore } from 'pinia';
import { getATA, createATA } from 'src/api';

export const useAccountStore = defineStore('userAccount', {
  state: () => ({
    solAccount: '',
    cenieiAccount: '',
    solBalance: 'NULL',
    cenieiBalance: 'NULL'
  }),
  getters: {
    getwrappedSolBalance: (state) => state.solBalance.toString(),
    getCenieiBalance: (state) => state.cenieiBalance.toString(),
    getCenieiAccount: (state) => state.cenieiAccount,
    getWrappedSolAccount: (state) => state.solAccount,
  },
  actions: {
    async setWrappedSolBalance() {
      [this.solAccount, this.solBalance] = await getATA(true);
    },
    async setCenieiBalance() {
        [this.cenieiAccount, this.cenieiBalance] = await getATA(false);
    },
    async createWrappedSolAta() {
        [this.solAccount, this.solBalance] = await createATA(true);
    },
    async createCenieiAta() {
        [this.cenieiAccount, this.cenieiBalance] = await createATA(false);
    }
  },
});
