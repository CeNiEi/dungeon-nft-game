import { defineStore } from 'pinia';
import { getATA } from 'src/api';

export const useAccountStore = defineStore('userAccount', {
  state: () => ({
    solBalance: BigInt(0),
    tokenBalance: BigInt(0)
  }),
  getters: {
    getwrappedSolBalance: (state) => state.solBalance.toString(),
    getCENIEIBalance: (state) => state.tokenBalance.toString()
  },
  actions: {
    async setWrappedSolBalance() {
      this.solBalance = await getATA(true);
    }
  },
});
