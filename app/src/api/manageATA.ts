import { useWorkspace, CENIEI_MINT } from 'src/composables';
import { AnchorProvider, web3 } from '@project-serum/anchor';
import {
  AccountLayout,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
  NATIVE_MINT,
} from '@solana/spl-token';

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

export const createATA = async (sol: boolean): Promise<[string, string]> => {
  const { provider } = useWorkspace();

  const [user, userATA, mint] = await findAtaDetails(sol);
  const tx = new web3.Transaction().add(
    createAssociatedTokenAccountInstruction(user, userATA, user, mint)
  );

  const txSignature = await provider.value.sendAndConfirm(tx);
  console.log(`Created a new ATA with signature: ${txSignature}`);

  return [userATA.toBase58(), '0'];
};

export const fundWrappedSolATA = async (amount: number): Promise<void> => {
  const { provider } = useWorkspace();

  const [user, userATA, ] = await findAtaDetails(true);

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

const findAtaDetails = async (
  sol: boolean
): Promise<[web3.PublicKey, web3.PublicKey, web3.PublicKey]> => {
  const { wallet } = useWorkspace();
  const user = wallet.value?.publicKey;

  if (user === undefined) {
    throw 'Wallet Undefined';
  }

  const mint = sol ? NATIVE_MINT : CENIEI_MINT;
  return [user, await getAssociatedTokenAddress(mint, user), mint];
};

export const getATA = async (sol: boolean): Promise<[string, string]> => {
  const { wallet, provider } = useWorkspace();
  if (wallet.value === undefined) {
    throw 'Wallet Undefined';
  }

  const tokenName = sol ? 'SOL' : 'CENIEI';

  const [, userATA, ] = await findAtaDetails(sol);
  const balanceRes = await fetchTokenAccountBalance(provider.value, userATA);

  if (balanceRes === null) {
    console.log(`${tokenName} ATA does note exists`);
    return ['', 'X'];
  }

  console.log(`${tokenName} balance: ${balanceRes.toString()}`);
  return [userATA.toBase58(), balanceRes.toString()];
};
