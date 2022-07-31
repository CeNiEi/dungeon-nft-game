import { web3 } from '@project-serum/anchor';
import {
  AccountLayout,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
  NATIVE_MINT,
} from '@solana/spl-token';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useWorkspace } from 'src/composables';

export const checkIfInitializd = async (accountPublicKey: web3.PublicKey) => {
  const { provider } = useWorkspace();
  const tokenInfo = await provider.value.connection.getAccountInfo(
    accountPublicKey
  );

  return tokenInfo;
};

export const fetchTokenAccountBalance = async (
  accountPublicKey: web3.PublicKey
): Promise<number | null> => {
  const tokenInfo = await checkIfInitializd(accountPublicKey);

  if (tokenInfo === null) {
    return null;
  }
  const amount = AccountLayout.decode(tokenInfo.data).amount;
  return Number((amount * 100n) / BigInt(LAMPORTS_PER_SOL)) / 100;
};

export const createATA = async (
  mint: web3.PublicKey
): Promise<[web3.PublicKey, string]> => {
  const { provider } = useWorkspace();

  const [user, userATA] = await findAtaDetails(mint);
  const tx = new web3.Transaction().add(
    createAssociatedTokenAccountInstruction(user, userATA, user, mint)
  );

  const txSignature = await provider.value.sendAndConfirm(tx);
  console.log(`Created a new ATA with signature: ${txSignature}`);

  return [userATA, '0'];
};

export const fundWrappedSolATA = async (amount: number): Promise<string> => {
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

  const balanceRes = await fetchTokenAccountBalance(userATA);
  return balanceRes!.toString();
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
): Promise<[web3.PublicKey, string]> => {
  const { wallet } = useWorkspace();
  if (wallet.value === undefined) {
    throw 'Wallet Undefined';
  }

  const tokenName = mint === NATIVE_MINT ? 'SOL' : 'CENIEI';

  const [, userATA] = await findAtaDetails(mint);
  const balanceRes = await fetchTokenAccountBalance(userATA);

  if (balanceRes === null) {
    console.log(`${tokenName} ATA does note exists`);
    return [web3.PublicKey.default, 'X'];
  }

  console.log(`${tokenName} balance: ${balanceRes.toString()}`);
  return [userATA, balanceRes.toString()];
};
