import { web3, utils, BN } from '@project-serum/anchor';
import { NATIVE_MINT, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useWorkspace } from 'src/composables';
import { findAtaDetails } from '.';

// ONLY AVAILABLE IF THE CURRENT WALLET IS THE BENEFICIARY
export const setupMarketPrereqs = async (
  beneficiary: web3.PublicKey
): Promise<[web3.PublicKey, web3.PublicKey, web3.PublicKey]> => {
  const { program, wallet } = useWorkspace();
  const user = wallet.value?.publicKey;

  if (user === undefined) {
    throw 'Wallet Undefined';
  }

  if (user !== beneficiary) {
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

  return [marketState, cenieiVault, solVault];
};

// ONLY AVAILABLE IF THE CURRENT WALLET IS THE BENEFICIARY
export const initializeMarket = async (
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

  if (user !== beneficiary) {
    throw 'Not the Admin';
  }

  let fee_num = new BN(0);
  let fee_den = new BN(1000);

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
};

// ONLY AVAILABLE IF THE CURRENT WALLET IS THE BENEFICIARY
export const addLiquidity = async (
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

  if (user !== beneficiary) {
    throw 'Not the Admin';
  }

  const [, userSolATA] = await findAtaDetails(NATIVE_MINT);
  const [, userCenieiATA] = await findAtaDetails(cenieiMint);

  const tokenAmount = new BN(50 * 10 ** 9);
  const solAmount = new BN(2 * web3.LAMPORTS_PER_SOL);

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
};

export const convertCurrency = async (
  solToToken: boolean,
  amount: number,
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

  const tx = await program.value.methods
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
    ? console.log(`Swapped Sol To Token with tx: ${tx}`)
    : console.log(`Swapped Token to Sol with tx: ${tx}`);
};
