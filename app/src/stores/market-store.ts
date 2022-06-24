import { web3, BN } from '@project-serum/anchor';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { defineStore } from 'pinia';
import {
  addLiquidity,
  convertCurrency,
  createCeniei,
  initializeMarket,
  setupMarketPrereqs,
  mintCeniei,
  checkIfInitializd,
  fetchTokenAccountBalance,
} from 'src/api';
import { useAccountStore } from './account-store';

export const useMarketStore = defineStore('market', {
  state: () => ({
    solVaultBalance: 'X',
    cenieiVaultBalance: 'X',
    marketState: PublicKey.default,
    cenieiMint: PublicKey.default,
    cenieiVault: PublicKey.default,
    solVault: PublicKey.default,
    beneficiary: 'Hzc6P8DY4rCUB4SwvhACN1JoYzPMxeNKqzEsngxAJsUU',
  }),
  getters: {
    getCenieiMint: (state) => state.cenieiMint,
    getCenieiVaultKey: (state) => state.cenieiVault.toBase58(),
    getSolVaultKey: (state) => state.solVault.toBase58(),
    getCenieiVaultBalance: (state) => state.cenieiVaultBalance,
    getSolVaultBalance: (state) => state.solVaultBalance,
  },
  actions: {
    async createCenieiMint() {
      this.cenieiMint = await createCeniei(this.beneficiary).catch((e) => {
        throw e;
      });
    },

    async mintCeniei() {
      const accountStore = useAccountStore();
      await mintCeniei(
        this.beneficiary,
        this.cenieiMint,
        accountStore.getCenieiAccountRaw
      ).catch((e) => {
        throw e;
      });
    },

    async createMarket() {
      [this.marketState, this.cenieiVault, this.solVault] =
        await setupMarketPrereqs(this.beneficiary).catch((e) => {
          throw e;
        });

      if (null !== (await checkIfInitializd(this.marketState))) {
        this.solVaultBalance = (await fetchTokenAccountBalance(
          this.solVault
        ))!.toString();
        this.cenieiVaultBalance = (await fetchTokenAccountBalance(
          this.cenieiVault
        ))!.toString();
        return;
      }

      [this.solVaultBalance, this.cenieiVaultBalance] = await initializeMarket(
        this.cenieiMint,
        this.marketState,
        this.cenieiVault,
        this.solVault,
        this.beneficiary
      ).catch((e) => {
        throw e;
      });
    },

    async addLiquidity() {
      [this.solVaultBalance, this.cenieiVaultBalance] = await addLiquidity(
        this.cenieiMint,
        this.marketState,
        this.cenieiVault,
        this.solVault,
        this.beneficiary
      ).catch((e) => {
        throw e;
      });
    },

    async convertSolToCeniei() {
      const lamports = BigInt(0.1 * LAMPORTS_PER_SOL);
      await convertCurrency(
        true,
        lamports,
        new web3.PublicKey(this.cenieiMint),
        new web3.PublicKey(this.marketState),
        new web3.PublicKey(this.cenieiVault),
        new web3.PublicKey(this.solVault),
        new web3.PublicKey(this.beneficiary)
      ).catch((e) => {
        throw e;
      });
    },

    async convertCenieiToSol(amount: bigint) {
      await convertCurrency(
        false,
        amount,
        new web3.PublicKey(this.cenieiMint),
        new web3.PublicKey(this.marketState),
        new web3.PublicKey(this.cenieiVault),
        new web3.PublicKey(this.solVault),
        new web3.PublicKey(this.beneficiary)
      ).catch((e) => {
        throw e;
      });
    },
  },
});
