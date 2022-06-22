import { AnchorProvider, web3 } from '@project-serum/anchor';
import {
  AccountLayout,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
  createInitializeMintInstruction,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  NATIVE_MINT,
} from '@solana/spl-token';
import { useWorkspace } from 'src/composables';
import { SystemProgram } from '@solana/web3.js';

// ONLY FOR LOCALNET TESTING
export const createCeniei = async (): Promise<web3.PublicKey> => {
  const { provider, wallet } = useWorkspace();
  const user = wallet.value?.publicKey;

  if (user === undefined) {
    throw 'Wallet Undefined';
  }
  const rentExemptLamports = await getMinimumBalanceForRentExemptMint(
    provider.value.connection
  );

  const newMint = web3.Keypair.generate();

  const tx = new web3.Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: user,
      newAccountPubkey: newMint.publicKey,
      space: MINT_SIZE,
      lamports: rentExemptLamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(newMint.publicKey, 9, user, user)
  );

  const txSignature = await provider.value.sendAndConfirm(tx, [newMint]);

  console.log(`CENIEI created with signature: ${txSignature}`);
  return newMint.publicKey;
};

export const fetchTokenAccountBalance = async (
  provider: AnchorProvider,
  accountPublicKey: web3.PublicKey
): Promise<bigint | null> => {
  const tokenInfoLol = await provider.connection.getAccountInfo(
    accountPublicKey
  );
  if (tokenInfoLol === null) {
    return null;
  }
  return AccountLayout.decode(tokenInfoLol.data).amount;
};

export const createATA = async (
  mint: web3.PublicKey
): Promise<[string, string]> => {
  const { provider } = useWorkspace();

  const [user, userATA] = await findAtaDetails(mint);
  const tx = new web3.Transaction().add(
    createAssociatedTokenAccountInstruction(user, userATA, user, mint)
  );

  const txSignature = await provider.value.sendAndConfirm(tx);
  console.log(`Created a new ATA with signature: ${txSignature}`);

  return [userATA.toBase58(), '0'];
};


export const fundWrappedSolATA = async (amount: number): Promise<void> => {
  const { provider } = useWorkspace();

  const [user, userATA] = await findAtaDetails(NATIVE_MINT);

  const tx = new web3.Transaction().add(
    web3.SystemProgram.transfer({
      fromPubkey: user,
      toPubkey: userATA,
      lamports: amount * web3.LAMPORTS_PER_SOL,
    }),
    createSyncNativeInstruction(userATA)
  );

  const txSignature = await provider.value.sendAndConfirm(tx);
  console.log(`Funded the Wrapped Sol ATA with ${amount} SOL: ${txSignature}`);
};

export const findAtaDetails = async (
  mint: web3.PublicKey
): Promise<[web3.PublicKey, web3.PublicKey]> => {
  const { wallet } = useWorkspace();
  const user = wallet.value?.publicKey;

  if (user === undefined) {
    throw 'Wallet Undefined';
  }

  return [user, await getAssociatedTokenAddress(mint, user)];
};

export const getATA = async (
  mint: web3.PublicKey
): Promise<[string, string]> => {
  const { wallet, provider } = useWorkspace();
  if (wallet.value === undefined) {
    throw 'Wallet Undefined';
  }

  const tokenName = (mint === NATIVE_MINT) ? 'SOL' : 'CENIEI';

  const [, userATA] = await findAtaDetails(mint);
  const balanceRes = await fetchTokenAccountBalance(provider.value, userATA);

  if (balanceRes === null) {
    console.log(`${tokenName} ATA does note exists`);
    return ['', 'X'];
  }

  console.log(`${tokenName} balance: ${balanceRes.toString()}`);
  return [userATA.toBase58(), balanceRes.toString()];
};
