<script lang="ts">
	import { getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import type { PublicKey } from '@solana/web3.js';
	import { workSpace } from '@svelte-on-solana/wallet-adapter-anchor';

    const BENEFICIARY_PUBLIC_KEY = 'HYK6PfsDteT7bPmhsMyFk7BuqygZjMzSQydautET9a9Z';
    const MINT_ADDRESS = 'GN6bYuoecUAL6PnXXuKHwAuLz4qEbHo1F5JgA5q2AvMn';
    const BENEFICIARY_ASSOCIATED_TOKEN_ACCOUNT = 'Ej4u57S8uUDSzbn8G9xFUXnbhBhUbWbWgyESwUEyM9HK';

	async function setupEscrow() {
		try {
            
		} catch (err) {
			console.log('Error setting up the transaction: ', err);
		}
	}
</script>
