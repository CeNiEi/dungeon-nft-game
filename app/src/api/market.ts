import { web3, utils, BN } from '@project-serum/anchor';
import {
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createMintToInstruction,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
} from '@solana/spl-token';
import { useWorkspace } from 'src/composables';
import { findAtaDetails } from '.';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { fetchTokenAccountBalance } from './manageATA';

// ONLY FOR LOCALNET TESTING / ADMIN
export const createCeniei = async (
  beneficiary: string
): Promise<web3.PublicKey> => {
  const { provider, wallet } = useWorkspace();
  const user = wallet.value?.publicKey;

  if (user === undefined) {
    throw 'Wallet Undefined';
  }

  if (user.toBase58() !== beneficiary) {
    console.log(user.toBase58());
    throw 'Not the admin';
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

  console.log(`CENIEI: ${newMint.publicKey}`);
  console.log(`CENIEI created with signature: ${txSignature}`);

  return newMint.publicKey;
};

// ONLY FOR LOCALNET TESTING / ADMIN
export const mintCeniei = async (
  beneficiary: string,
  cenieiMint: web3.PublicKey,
  cenieiATA: web3.PublicKey
) => {
  const { provider, wallet } = useWorkspace();
  const user = wallet.value?.publicKey;

  if (user === undefined) {
    throw 'Wallet Undefined';
  }

  if (user.toBase58() !== beneficiary) {
    console.log(user.toBase58());
    throw 'Not the admin';
  }

  const tx = new web3.Transaction().add(
    createMintToInstruction(cenieiMint, cenieiATA, user, 10000 * 10 ** 9)
  );
  const txHash = await provider.value.sendAndConfirm(tx);
  console.log(
    `Successfully funded Admin ATA with 10000 CENIEI with signature: ${txHash}`
  );
};

// ONLY AVAILABLE IF THE CURRENT WALLET IS THE BENEFICIARY
export const setupMarketPrereqs = async (
  beneficiary: string
): Promise<[web3.PublicKey, web3.PublicKey, web3.PublicKey]> => {
  const { program, wallet } = useWorkspace();
  const user = wallet.value?.publicKey;

  if (user === undefined) {
    throw 'Wallet Undefined';
  }

  if (user.toBase58() !== beneficiary) {
    console.log(user.toBase58());
    throw 'Not the admin';
  }

  const [marketState] = await web3.PublicKey.findProgramAddress(
    [utils.bytes.utf8.encode('market-state'), user.toBuffer()],
    program.value.programId
  );

  const [cenieiVault] = await web3.PublicKey.findProgramAddress(
    [
      utils.bytes.utf8.encode('token-vault'),
      marketState.toBuffer(),
      user.toBuffer(),
    ],
    program.value.programId
  );
  const [solVault] = await web3.PublicKey.findProgramAddress(
    [
      utils.bytes.utf8.encode('sol-vault'),
      marketState.toBuffer(),
      user.toBuffer(),
    ],
    program.value.programId
  );

  console.log('Successfully initialized all the prerquesites');
  return [marketState, cenieiVault, solVault];
};

// ONLY AVAILABLE IF THE CURRENT WALLET IS THE BENEFICIARY
export const initializeMarket = async (
  cenieiMint: web3.PublicKey,
  marketState: web3.PublicKey,
  cenieiVault: web3.PublicKey,
  solVault: web3.PublicKey,
  beneficiary: string
): Promise<[string, string]> => {
  const { program, wallet } = useWorkspace();
  const user = wallet.value?.publicKey;

  if (user === undefined) {
    throw 'wallet undefined';
  }

  if (user.toBase58() !== beneficiary) {
    throw 'Not the Admin';
  }

  const fee_num = new BN(0);
  const fee_den = new BN(1000);

  const tx = await program.value.methods
    .ammSetupInstruction(fee_num, fee_den)
    .accounts({
      tokenMint: cenieiMint,
      solMint: NATIVE_MINT,

      marketState: marketState,

      tokenVault: cenieiVault,
      solVault: solVault,

      beneficiary: user,

      systemProgram: web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: web3.SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  console.log(`Initialized a new market with signature: ${tx}`);
  return ['0', '0'];
};

// ONLY AVAILABLE IF THE CURRENT WALLET IS THE BENEFICIARY
export const addLiquidity = async (
  cenieiMint: web3.PublicKey,
  marketState: web3.PublicKey,
  cenieiVault: web3.PublicKey,
  solVault: web3.PublicKey,
  beneficiary: string
) => {
  const { program, wallet } = useWorkspace();
  const user = wallet.value?.publicKey;

  if (user === undefined) {
    throw 'wallet undefined';
  }

  if (user.toBase58() !== beneficiary) {
    throw 'Not the Admin';
  }

  const [, userSolATA] = await findAtaDetails(NATIVE_MINT);
  const [, userCenieiATA] = await findAtaDetails(cenieiMint);

  const tokenAmount = new BN(10000 * 10 ** 9);
  const solAmount = new BN(1 * web3.LAMPORTS_PER_SOL);

  const tx = await program.value.methods
    .addLiquidityInstruction(tokenAmount, solAmount)
    .accounts({
      marketState: marketState,
      tokenVault: cenieiVault,
      solVault: solVault,
      beneficiary: user,
      beneficiaryTokenAta: userCenieiATA,
      beneficiarySolAta: userSolATA,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  console.log(`Added Liquidity to the market with signature: ${tx}`);

  const solVaultBalance = await fetchTokenAccountBalance(solVault);
  const cenieiVaultBalance = await fetchTokenAccountBalance(cenieiVault);
  return [solVaultBalance!.toString(), cenieiVaultBalance!.toString()];
};

export const convertCurrency = async (
  solToToken: boolean,
  amount: BN,
  cenieiMint: web3.PublicKey,
  marketState: web3.PublicKey,
  cenieiVault: web3.PublicKey,
  solVault: web3.PublicKey,
  beneficiary: web3.PublicKey
) => {
  const { program, wallet } = useWorkspace();
  const user = wallet.value?.publicKey;

  if (user === undefined) {
    throw 'wallet undefined';
  }

  const [, userSolATA] = await findAtaDetails(NATIVE_MINT);
  const [, userCenieiATA] = await findAtaDetails(cenieiMint);

  const txHash = await program.value.methods
    .swapTokensInstruction(amount, solToToken)
    .accounts({
      marketState: marketState,
      tokenVault: cenieiVault,
      solVault: solVault,
      player: user,
      beneficiary: beneficiary,
      playerTokenAta: userCenieiATA,
      playerSolAta: userSolATA,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  solToToken
    ? console.log(`Swapped Sol To Token with txHash: ${txHash}`)
    : console.log(`Swapped Token to Sol with txHash: ${txHash}`);

  const solVaultBalance = await fetchTokenAccountBalance(solVault);
  const cenieiVaultBalance = await fetchTokenAccountBalance(cenieiVault);
  return [solVaultBalance!.toString(), cenieiVaultBalance!.toString()];
};
