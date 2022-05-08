/*
import * as anchor from "@project-serum/anchor";
import * as spl from "@solana/spl-token";
import { Program } from "@project-serum/anchor";
import { DungeonNft } from "../target/types/dungeon_nft";
import assert from "assert";

interface PDAParameters {
  escrowWalletKey: anchor.web3.PublicKey,
  stateKey: anchor.web3.PublicKey,
  idx: anchor.BN
}

describe("DungeonNFT", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DungeonNft as Program<DungeonNft>;

  let mintAddress: anchor.web3.PublicKey;
  let sender: anchor.web3.Keypair;
  let senderWallet: anchor.web3.PublicKey;
  let receiver: anchor.web3.Keypair;

  let pda: PDAParameters;

  const getPdaParams = async (connection: anchor.web3.Connection, sender: anchor.web3.PublicKey, receiver: anchor.web3.PublicKey, mint: anchor.web3.PublicKey): Promise<PDAParameters> => {
    const uid = new anchor.BN(parseInt((Date.now() / 1000).toString()));
    const uidBuffer = uid.toBuffer('le', 8);

    let [statePubKey,] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("application-state"), sender.toBuffer(), receiver.toBuffer(), mint.toBuffer(), uidBuffer], program.programId
    );

    let [walletPubKey,] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("escrow-wallet-state"), sender.toBuffer(), receiver.toBuffer(), mint.toBuffer(), uidBuffer], program.programId
    );

    return {
      idx: uid,
      escrowWalletKey: walletPubKey,
      stateKey: statePubKey,
    }

  }

  const createMint = async (connection: anchor.web3.Connection): Promise<anchor.web3.PublicKey> => {
    const tokenMint = new anchor.web3.Keypair();
    const lamportsForMint = await provider.connection.getMinimumBalanceForRentExemption(spl.MintLayout.span);

    let tx = new anchor.web3.Transaction();

    tx.add(
      anchor.web3.SystemProgram.createAccount({
        programId: spl.TOKEN_PROGRAM_ID,
        space: spl.MintLayout.span,
        fromPubkey: provider.wallet.publicKey,
        newAccountPubkey: tokenMint.publicKey,
        lamports: lamportsForMint
      })
    );

    tx.add(
      spl.createInitializeMintInstruction(
        tokenMint.publicKey,
        6,
        provider.wallet.publicKey,
        provider.wallet.publicKey
      )
    );

    const signature = await provider.sendAndConfirm(tx, [tokenMint]);

    console.log(`[${tokenMint.publicKey}] Created new mint account at ${signature}`);
    return tokenMint.publicKey;
  }

  const createUserAndAssociatedWallet = async (connection: anchor.web3.Connection, mint?: anchor.web3.PublicKey): Promise<[anchor.web3.Keypair, anchor.web3.PublicKey | undefined]> => {
    const user = new anchor.web3.Keypair();
    let userAssociatedTokenAccount: anchor.web3.PublicKey | undefined = undefined;

    let txFund = new anchor.web3.Transaction();
    txFund.add(anchor.web3.SystemProgram.transfer({
      fromPubkey: provider.wallet.publicKey,
      toPubkey: user.publicKey,
      lamports: 5 * anchor.web3.LAMPORTS_PER_SOL
    }));

    const sigTxFund = await provider.sendAndConfirm(txFund);
    console.log(`[${user.publicKey.toBase58()}] Funded new account with 5 SOL: ${sigTxFund}`);

    if (mint) {
      userAssociatedTokenAccount = await spl.getAssociatedTokenAddress(
        mint,
        user.publicKey
      );

      const txFundTokenAccount = new anchor.web3.Transaction();
      txFundTokenAccount.add(spl.createAssociatedTokenAccountInstruction(
        user.publicKey,
        userAssociatedTokenAccount,
        user.publicKey,
        mint,
      ));

      txFundTokenAccount.add(spl.createMintToInstruction(
        mint,
        userAssociatedTokenAccount,
        provider.wallet.publicKey,
        1337000000
      ));

      const txFundTokenSig = await provider.sendAndConfirm(txFundTokenAccount, [user]);
      console.log(`[${userAssociatedTokenAccount.toBase58()}] New associated account for mint ${mint.toBase58()}: ${txFundTokenSig}`);
    }

    return [user, userAssociatedTokenAccount];
  }


  const readAccount = async (accountPublicKey: anchor.web3.PublicKey, provider: anchor.Provider): Promise<[spl.RawAccount, string]> => {
    const tokenInfoLol = await provider.connection.getAccountInfo(accountPublicKey);
    const data = Buffer.from(tokenInfoLol.data);
    const accountInfo: spl.RawAccount = spl.AccountLayout.decode(data);

    const amount = accountInfo.amount;
    return [accountInfo, amount.toString()];
  }


  beforeEach(async () => {
    mintAddress = await createMint(provider.connection);
    [sender, senderWallet] = await createUserAndAssociatedWallet(provider.connection, mintAddress);

    [receiver,] = await createUserAndAssociatedWallet(provider.connection);

    pda = await getPdaParams(provider.connection, sender.publicKey, receiver.publicKey, mintAddress);
  });

  it('can initialize a safe payment by the sender', async () => {
    const [, senderBalancePre] = await readAccount(senderWallet, provider);
    assert.equal(senderBalancePre, '1337000000');

    const amount = new anchor.BN(20000000);

    const tx1 = await program.methods.initializeNewGrant(pda.idx, amount).accounts({
      applicationState: pda.stateKey,
      escrowWalletState: pda.escrowWalletKey,
      mintOfTokenBeingSent: mintAddress,
      sender: sender.publicKey,
      receiver: receiver.publicKey,
      walletToWithdrawFrom: senderWallet,

      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: spl.TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY
    }).signers([sender]).rpc();

    console.log(`Initialized a new Safe Pay instance. Sender will pay receiver 20 tokens`);

    const [, senderBalancePost] = await readAccount(senderWallet, provider);
    assert.equal(senderBalancePost, '1317000000');
    const [, escrowBalancePost] = await readAccount(pda.escrowWalletKey, provider);
    assert.equal(escrowBalancePost, '20000000');

    const state = await program.account.state.fetch(pda.stateKey);
    assert.equal(state.amountOfTokens.toString(), '20000000');
    assert.equal(state.stage.toString(), '1');

  });

  it('can send escrow funds to Bob', async () => {
    const [, aliceBalancePre] = await readAccount(senderWallet, provider);
    assert.equal(aliceBalancePre, '1337000000');

    const amount = new anchor.BN(20000000)

    const tx1 = await program.methods.initializeNewGrant(pda.idx, amount).accounts({
      applicationState: pda.stateKey,
      escrowWalletState: pda.escrowWalletKey,
      mintOfTokenBeingSent: mintAddress,
      sender: sender.publicKey,
      receiver: receiver.publicKey,
      walletToWithdrawFrom: senderWallet,

      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: spl.TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY
    }).signers([sender]).rpc();

    console.log(`Initialized a new Safe Pay instance. Sender will pay receiver 20 tokens`);

    const [, senderBalancePost] = await readAccount(senderWallet, provider);
    assert.equal(senderBalancePost, '1317000000');
    const [, escrowBalancePost] = await readAccount(pda.escrowWalletKey, provider);
    assert.equal(escrowBalancePost, '20000000');


    const receiverTokenAccount = await spl.getAssociatedTokenAddress(
      mintAddress,
      receiver.publicKey
    )

    const tx2 = await program.methods.completeGrant(pda.idx).accounts({
      applicationState: pda.stateKey,
      escrowWalletState: pda.escrowWalletKey,
      mintOfTokenBeingSent: mintAddress,
      sender: sender.publicKey,
      receiver: receiver.publicKey,
      walletToDepositTo: receiverTokenAccount,

      systemProgram: anchor.web3.SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      tokenProgram: spl.TOKEN_PROGRAM_ID,
      associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID
    }).signers([receiver]).rpc();

    const [, receiverBalance] = await readAccount(receiverTokenAccount, provider);
    assert.equal(receiverBalance, '20000000');

    try {
      await readAccount(pda.escrowWalletKey, provider);
      return assert.fail("Account should be closed");
    } catch (e) {
      assert.equal(e.message, "Cannot read properties of null (reading 'data')");
    }
  });

  it('can pull back funds once they are deposited', async () => {
    const [, senderBalancePre] = await readAccount(senderWallet, provider);
    assert.equal(senderBalancePre, '1337000000');

    const amount = new anchor.BN(20000000);

    const tx1 = await program.methods.initializeNewGrant(pda.idx, amount).accounts({
      applicationState: pda.stateKey,
      escrowWalletState: pda.escrowWalletKey,
      mintOfTokenBeingSent: mintAddress,
      sender: sender.publicKey,
      receiver: receiver.publicKey,
      walletToWithdrawFrom: senderWallet,

      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: spl.TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY
    }).signers([sender]).rpc();

    console.log(`Initialized a new Safe Pay instance. Sender will pay receiver 20 tokens`);

    const [, senderBalancePost] = await readAccount(senderWallet, provider);
    assert.equal(senderBalancePost, '1317000000');
    const [, escrowBalancePost] = await readAccount(pda.escrowWalletKey, provider);
    assert.equal(escrowBalancePost, '20000000');

    const tx2 = await program.methods.pullBack(pda.idx).accounts({
      applicationState: pda.stateKey, 
      escrowWalletState: pda.escrowWalletKey, 
      mintOfTokenBeingSent: mintAddress, 
      sender: sender.publicKey, 
      receiver: receiver.publicKey, 
      refundWallet: senderWallet,

      systemProgram: anchor.web3.SystemProgram.programId, 
      rent: anchor.web3.SYSVAR_RENT_PUBKEY, 
      tokenProgram: spl.TOKEN_PROGRAM_ID
    }).signers([sender]).rpc();
      
    // Assert that 20 tokens were sent back.
    const [, senderBalanceRefund] = await readAccount(senderWallet, provider);
    assert.equal(senderBalanceRefund, '1337000000');

    // Assert that escrow was correctly closed.
    try {
      await readAccount(pda.escrowWalletKey, provider);
      return assert.fail("Account should be closed");
    } catch (e) {
      assert.equal(e.message, "Cannot read properties of null (reading 'data')");
    }

    const state = await program.account.state.fetch(pda.stateKey);
    assert.equal(state.amountOfTokens.toString(), '20000000');
    assert.equal(state.stage.toString(), '3');

  })


});
*/