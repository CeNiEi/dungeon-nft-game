import { defineStore } from 'pinia';
import { getATA, createATA, fundWrappedSolATA } from 'src/api';

export const useAccountStore = defineStore('userAccount', {
  state: () => ({
    solAccount: '',
    cenieiAccount: '',
    solBalance: 'X',
    cenieiBalance: 'X',
  }),
  getters: {
    getWrappedSolBalance: (state) => state.solBalance,
    getWrappedSolAccount: (state) => state.solAccount,
    getCenieiBalance: (state) => state.cenieiBalance,
    getCenieiAccount: (state) => state.cenieiAccount,
  },
  actions: {
    async setWrappedSolBalance() {
      [this.solAccount, this.solBalance] = await getATA(true).catch((e) => {
        throw e;
      });
    },
    async setCenieiBalance() {
      [this.cenieiAccount, this.cenieiBalance] = await getATA(false).catch(
        (e) => {
          throw e;
        }
      );
    },
    async createWrappedSolAta() {
      [this.solAccount, this.solBalance] = await createATA(true).catch((e) => {
        throw e;
      });
    },
    async createCenieiAta() {
      [this.cenieiAccount, this.cenieiBalance] = await createATA(false).catch(
        (e) => {
          throw e;
        }
      );
    },
    async fundWrappedSolATA() {
      const amount = 1;
      await fundWrappedSolATA(amount).catch((e) => {
        throw e;
      });
      this.solBalance = amount.toString();
    },
  },
});
