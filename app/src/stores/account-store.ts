import { NATIVE_MINT } from '@solana/spl-token';
import { defineStore } from 'pinia';
import { getATA, createATA, fundWrappedSolATA } from 'src/api';
import { useMarketStore } from './market-store';
import { web3 } from '@project-serum/anchor';

export const useAccountStore = defineStore('userAccount', {
  state: () => ({
    solAccount: web3.PublicKey.default,
    cenieiAccount: web3.PublicKey.default,
    solBalance: 'X',
    cenieiBalance: 'X',
  }),
  getters: {
    getWrappedSolBalance: (state) => state.solBalance,
    getWrappedSolAccount: (state) => state.solAccount.toBase58(),
    getWrappedSolAccountRaw: (state) => state.solAccount,
    getCenieiBalance: (state) => state.cenieiBalance,
    getCenieiAccount: (state) => state.cenieiAccount.toBase58(),
    getCenieiAccountRaw: (state) => state.cenieiAccount,
  },
  actions: {
    async setWrappedSolBalance() {
      [this.solAccount, this.solBalance] = await getATA(NATIVE_MINT).catch(
        (e) => {
          throw e;
        }
      );
    },
    async setCenieiBalance() {
      const marketStore = useMarketStore();
      try {
        const cenieiMint = marketStore.getCenieiMint;
        [this.cenieiAccount, this.cenieiBalance] = await getATA(cenieiMint);
      } catch (e) {
        throw e;
      }
    },
    async createWrappedSolAta() {
      [this.solAccount, this.solBalance] = await createATA(NATIVE_MINT).catch(
        (e) => {
          throw e;
        }
      );
    },
    async createCenieiAta() {
      const marketStore = useMarketStore();
      try {
        const cenieiMint = marketStore.getCenieiMint;
        [this.cenieiAccount, this.cenieiBalance] = await createATA(cenieiMint);
      } catch (e) {
        throw e;
      }
    },
    async fundWrappedSolATA() {
      //CAN BE CHANGED
      const amount = 1;
      this.solBalance = await fundWrappedSolATA(amount).catch((e) => {
        throw e;
      });
    },
  },
});
