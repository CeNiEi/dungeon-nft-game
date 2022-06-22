import { web3 } from '@project-serum/anchor';
import { defineStore } from 'pinia';
import {
  addLiquidity,
  createCeniei,
  initializeMarket,
  setupMarketPrereqs,
} from 'src/api';
import { useAccountStore } from './account-store';

export const useMarketStore = defineStore('market', {
  state: () => ({
    marketState: '',
    cenieiMint: '',
    cenieiVault: '',
    solVault: '',
    beneficiary: 'Hzc6P8DY4rCUB4SwvhACN1JoYzPMxeNKqzEsngxAJsUU',
  }),
  getters: {
    getCenieiMint: (state) => state.cenieiMint,
  },
  actions: {
    async createCenieiMint() {
      const newMint = await createCeniei().catch((e) => {
        throw e;
      });
      this.cenieiMint = newMint.toBase58();
    },

    async setupMarket() {
      const [stateKey, cenieiVaultKey, solVaultKey] = await setupMarketPrereqs(
        new web3.PublicKey(this.beneficiary)
      ).catch((e) => {
        throw e;
      });

      [this.marketState, this.cenieiVault, this.solVault] = [
        stateKey.toBase58(),
        cenieiVaultKey.toBase58(),
        solVaultKey.toBase58(),
      ];
    },

    async initializeMarket() {
      await initializeMarket(
        new web3.PublicKey(this.cenieiMint),
        new web3.PublicKey(this.marketState),
        new web3.PublicKey(this.cenieiVault),
        new web3.PublicKey(this.solVault),
        new web3.PublicKey(this.beneficiary)
      ).catch((e) => {
        throw e;
      });
    },

    async addLiquidity() {
      await addLiquidity(
        new web3.PublicKey(this.cenieiMint),
        new web3.PublicKey(this.marketState),
        new web3.PublicKey(this.cenieiVault),
        new web3.PublicKey(this.solVault),
        new web3.PublicKey(this.beneficiary)
      ).catch((e) => {
        throw e;
      });

      const accountStore = useAccountStore();

      await accountStore.setCenieiBalance().catch((e) => {throw e;});
      await accountStore.setWrappedSolBalance().catch((e) => {throw e;});
    },

  },
});
