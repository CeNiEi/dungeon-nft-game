import * as anchor from "@project-serum/anchor";
import * as spl from "@solana/spl-token";
import { Program } from "@project-serum/anchor";
import { DungeonNft } from "../target/types/dungeon_nft";
import assert from "assert";

interface State {
  mint: anchor.web3.PublicKey,
  beneficiary: anchor.web3.PublicKey,
  beneficiarySigner: anchor.web3.Keypair,
  beneficiaryAssociatedTokenAccount: anchor.web3.PublicKey
  player: anchor.web3.PublicKey,
  playerSigner: anchor.web3.Keypair,
  playerAssociatedTokenAccount: anchor.web3.PublicKey,
  transactionState: anchor.web3.PublicKey,
  escrowAccount: anchor.web3.PublicKey
}

describe("DungeonNFT", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DungeonNft as Program<DungeonNft>;

  //  const MINT_ADDRESS = new anchor.web3.PublicKey('GN6bYuoecUAL6PnXXuKHwAuLz4qEbHo1F5JgA5q2AvMn');
  //  const BENEFICIARY = new anchor.web3.PublicKey('HYK6PfsDteT7bPmhsMyFk7BuqygZjMzSQydautET9a9Z');
  //  const BENEFICIARY_ASSOCIATED_TOKEN_ACCOUNT = new anchor.web3.PublicKey('Ej4u57S8uUDSzbn8G9xFUXnbhBhUbWbWgyESwUEyM9HK');

  const NUM_OF_DECIMALS = 9;

  let state: State;

  const createUserAssociatedTokenAccount = async (user: anchor.web3.PublicKey, userSigner: anchor.web3.Keypair, mint: anchor.web3.PublicKey, mintAuthority: anchor.web3.PublicKey, mintAuthoritySigner: anchor.web3.Keypair): Promise<anchor.web3.PublicKey> => {
    const userAssociatedTokenAccount = await spl.getAssociatedTokenAddress(
      mint,
      user
    );

    const tx = new anchor.web3.Transaction;

    tx.add(spl.createAssociatedTokenAccountInstruction(
      user,
      userAssociatedTokenAccount,
      user,
      mint
    ));

    tx.add(spl.createMintToInstruction(
      mint,
      userAssociatedTokenAccount,
      mintAuthority,
      100 * 10 ** NUM_OF_DECIMALS
    ));

    await provider.sendAndConfirm(tx, [userSigner, mintAuthoritySigner]);

    return userAssociatedTokenAccount;
  }

  const createUser = async (): Promise<[anchor.web3.Keypair, anchor.web3.PublicKey]> => {
    const userSigner = new anchor.web3.Keypair;
    const user = userSigner.publicKey;

    let userTx = await provider.connection.requestAirdrop(user, 10 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(userTx);

    return [userSigner, user];
  }

  const readTokenAccount = async (accountPublicKey: anchor.web3.PublicKey): Promise<[spl.RawAccount, string]> => {

    const tokenInfoLol = await provider.connection.getAccountInfo(accountPublicKey);
    const accountInfo: spl.RawAccount = spl.AccountLayout.decode(tokenInfoLol.data);

    const amount = accountInfo.amount;
    return [accountInfo, amount.toString()];
  }


  it('can setup all the prereqs', async () => {

    let [playerSigner, player] = await createUser();
    let [beneficiarySigner, beneficiary] = await createUser();

    const mint = await spl.createMint(provider.connection, beneficiarySigner, beneficiary, beneficiary, NUM_OF_DECIMALS);

    const playerAssociatedTokenAccount = await createUserAssociatedTokenAccount(player, playerSigner, mint, beneficiary, beneficiarySigner);
    const beneficiaryAssociatedTokenAccount = await createUserAssociatedTokenAccount(beneficiary, beneficiarySigner, mint, beneficiary, beneficiarySigner);

    let [transactionState,] = await anchor.web3.PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode("transaction-state"), player.toBuffer(), beneficiary.toBuffer(), mint.toBuffer()],
      program.programId);

    let [escrowAccount,] = await anchor.web3.PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode("escrow-account"), player.toBuffer(), beneficiary.toBuffer(), mint.toBuffer()],
      program.programId);

    state = {
      mint: mint,
      beneficiary: beneficiary,
      beneficiarySigner: beneficiarySigner,
      beneficiaryAssociatedTokenAccount: beneficiaryAssociatedTokenAccount,
      player: player,
      playerSigner: playerSigner,
      playerAssociatedTokenAccount: playerAssociatedTokenAccount,
      transactionState: transactionState,
      escrowAccount: escrowAccount
    }
  });

  it('can initialize a safe payment by the sender', async () => {
    const tx = await program.methods.transactionSetup().accounts({
      transactionState: state.transactionState,
      escrowAccount: state.escrowAccount,
      player: state.player,
      beneficiary: state.beneficiary,
      mintOfToken: state.mint,

      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: spl.TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY
    }).signers([state.playerSigner]).rpc();

    assert.ok(tx);
    console.log(`Initialized a new Safe Pay instance with signature: ${tx}`);
  });

  it('can fund the escrow by the both the parties', async () => {
    const [, preTransactionPlayerBalance] = await readTokenAccount(state.playerAssociatedTokenAccount);
    assert.equal(preTransactionPlayerBalance, 100 * 10 ** NUM_OF_DECIMALS);

    const [, preTransactionBeneficiaryBalance] = await readTokenAccount(state.beneficiaryAssociatedTokenAccount);
    assert.equal(preTransactionBeneficiaryBalance, 100 * 10 ** NUM_OF_DECIMALS);

    const amount = new anchor.BN(10 * 10 ** NUM_OF_DECIMALS)

    const tx = await program.methods.depositByBothParties(amount).accounts({
      transactionState: state.transactionState,
      escrowAccount: state.escrowAccount,
      player: state.player,
      beneficiary: state.beneficiary,
      mintOfToken: state.mint,
      playerAssociatedTokenAccount: state.playerAssociatedTokenAccount,
      beneficiaryAssociatedTokenAccount: state.beneficiaryAssociatedTokenAccount,

      tokenProgram: spl.TOKEN_PROGRAM_ID,
    }).signers([state.playerSigner, state.beneficiarySigner]).rpc();

    const [, postTransactionPlayerBalance] = await readTokenAccount(state.playerAssociatedTokenAccount);
    assert.equal(postTransactionPlayerBalance, 90 * 10 ** NUM_OF_DECIMALS);

    const [, postTransactionBeneficiaryBalance] = await readTokenAccount(state.beneficiaryAssociatedTokenAccount);
    assert.equal(postTransactionBeneficiaryBalance, 90 * 10 ** NUM_OF_DECIMALS);

    const [, postTransactoinEscrowBalance] = await readTokenAccount(state.escrowAccount);
    assert.equal(postTransactoinEscrowBalance, 2 * 10 * 10 ** NUM_OF_DECIMALS);

    assert.ok(tx);
    console.log(`Funded the escrow with signature: ${tx}`);

  });

  it('can transfer the entire funds to the winner', async () => {

    let winner: anchor.web3.PublicKey;
    let winnerAssociatedTokenAccount: anchor.web3.PublicKey;

    if (Math.random() < 0.5) {
      winner = state.player;
      winnerAssociatedTokenAccount = state.playerAssociatedTokenAccount;
    } else {
      winner = state.beneficiary;
      winnerAssociatedTokenAccount = state.beneficiaryAssociatedTokenAccount;
    }

    const [, preTransactionWinnerBalance] = await readTokenAccount(winnerAssociatedTokenAccount);
    assert.equal(preTransactionWinnerBalance, 90 * 10 ** NUM_OF_DECIMALS);

    const [, preTransactoinEscrowBalance] = await readTokenAccount(state.escrowAccount);
    assert.equal(preTransactoinEscrowBalance, 2 * 10 * 10 ** NUM_OF_DECIMALS);

    const tx = await program.methods.transferToWinner(winner).accounts({
      transactionState: state.transactionState,
      escrowAccount: state.escrowAccount,
      player: state.player,
      beneficiary: state.beneficiary,
      mintOfToken: state.mint,
      winnerAssociatedTokenAccount: winnerAssociatedTokenAccount,
      tokenProgram: spl.TOKEN_PROGRAM_ID
    }).rpc();

    const [, postTransactionWinnerBalance] = await readTokenAccount(winnerAssociatedTokenAccount);
    assert.equal(postTransactionWinnerBalance, 110 * 10 ** NUM_OF_DECIMALS)

    try {
      await readTokenAccount(state.escrowAccount);
      return assert.fail("Account should be closed");
    } catch (e) {
      assert.equal(e.message, "Cannot read properties of null (reading 'data')");
    }

    try {
      await readTokenAccount(state.transactionState);
      return assert.fail("Account should be deleted");
    } catch (e) {
      assert.equal(e.message, "Cannot read properties of null (reading 'data')");
    }

    assert.ok(tx);
    console.log(`Successfully transfered the funds to the winner with signature: ${tx}`);
  });

  it('can pull back the funds by player', async () => {
    const [, preTransactionPlayerBalance] = await readTokenAccount(state.playerAssociatedTokenAccount);
    assert.equal(preTransactionPlayerBalance, 90 * 10 ** NUM_OF_DECIMALS);

    const [, preTransactionBeneficiaryBalance] = await readTokenAccount(state.beneficiaryAssociatedTokenAccount);
    assert.equal(preTransactionBeneficiaryBalance, 90 * 10 ** NUM_OF_DECIMALS);

    const [, preTransactoinEscrowBalance] = await readTokenAccount(state.escrowAccount);
    assert.equal(preTransactoinEscrowBalance, 2 * 10 * 10 ** NUM_OF_DECIMALS);

    const tx = await program.methods.pullBack().accounts({
      transactionState: state.transactionState,
      escrowAccount: state.escrowAccount,
      player: state.player,
      beneficiary: state.beneficiary,
      mintOfToken: state.mint,
      playerAssociatedTokenAccount: state.playerAssociatedTokenAccount,
      beneficiaryAssociatedTokenAccount: state.beneficiaryAssociatedTokenAccount,

      tokenProgram: spl.TOKEN_PROGRAM_ID,
    }).rpc();

    const [, postTransactionPlayerBalance] = await readTokenAccount(state.playerAssociatedTokenAccount);
    assert.equal(postTransactionPlayerBalance, 100 * 10 ** NUM_OF_DECIMALS);

    const [, postTransactionBeneficiaryBalance] = await readTokenAccount(state.beneficiaryAssociatedTokenAccount);
    assert.equal(postTransactionBeneficiaryBalance, 100 * 10 ** NUM_OF_DECIMALS);

    try {
      await readTokenAccount(state.escrowAccount);
      return assert.fail("Account should be closed");
    } catch (e) {
      assert.equal(e.message, "Cannot read properties of null (reading 'data')");
    }

    try {
      await readTokenAccount(state.transactionState);
      return assert.fail("Account should be deleted");
    } catch (e) {
      assert.equal(e.message, "Cannot read properties of null (reading 'data')");
    }

    assert.ok(tx);
    console.log(`Successfully pulled back the funds with signature: ${tx}`);

  });


});


