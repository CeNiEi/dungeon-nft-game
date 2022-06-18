import { defineStore } from 'pinia';

export const useAccountStore = defineStore('userAccount', {
  state: () => ({
    solBalance: 0, 
    tokenBalance: 0
  }),
  getters: {
    solBalance: (state) => state.solBalance,
    tokenBalance: (state) => state.tokenBalance
  },
  actions: {
  },
});
