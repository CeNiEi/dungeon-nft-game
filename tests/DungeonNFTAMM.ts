import * as anchor from "@project-serum/anchor";
import * as spl from "@solana/spl-token";

import { Program } from "@project-serum/anchor";
import { DungeonNft } from "../target/types/dungeon_nft";
import assert from "assert";
import { createSyncNativeInstruction } from "@solana/spl-token";


const NUM_OF_DECIMALS = 9;


interface State {
    tokenMint: anchor.web3.PublicKey,
    solMint: anchor.web3.PublicKey,

    beneficiary: anchor.web3.PublicKey,
    beneficiarySigner: anchor.web3.Keypair,
    player: anchor.web3.PublicKey,
    playerSigner: anchor.web3.Keypair,

    beneficiaryTokenAssociatedTokenAccount: anchor.web3.PublicKey,
    beneficiarySolAssociatedTokenAccount: anchor.web3.PublicKey,
    playerTokenAssociatedTokenAccount: anchor.web3.PublicKey,
    playerSolAssociatedTokenAccount: anchor.web3.PublicKey,

    marketState: anchor.web3.PublicKey,
    tokenVault: anchor.web3.PublicKey,
    solVault: anchor.web3.PublicKey,
};

const createUserAssociatedTokenAccount = async (provider: anchor.AnchorProvider, user: anchor.web3.PublicKey, userSigner: anchor.web3.Keypair, mint: anchor.web3.PublicKey, mintAuthority?: anchor.web3.PublicKey, mintAuthoritySigner?: anchor.web3.Keypair): Promise<anchor.web3.PublicKey> => {
    const userAssociatedTokenAccount = await spl.getAssociatedTokenAddress(
        mint,
        user
    );

    const tx = new anchor.web3.Transaction;
    const amount = 100;

    tx.add(spl.createAssociatedTokenAccountInstruction(
        user,
        userAssociatedTokenAccount,
        user,
        mint
    ));

    if (mint == spl.NATIVE_MINT) {
        tx.add(
            anchor.web3.SystemProgram.transfer({
                fromPubkey: user,
                toPubkey: userAssociatedTokenAccount,
                lamports: 5 * anchor.web3.LAMPORTS_PER_SOL
            }),
            createSyncNativeInstruction(userAssociatedTokenAccount)
        );

        await provider.sendAndConfirm(tx, [userSigner]);
    } else {
        tx.add(spl.createMintToInstruction(
            mint,
            userAssociatedTokenAccount,
            mintAuthority,
            amount * 10 ** NUM_OF_DECIMALS
        ));

        await provider.sendAndConfirm(tx, [userSigner, mintAuthoritySigner]);
    }

    return userAssociatedTokenAccount;
}


const createUser = async (provider: anchor.AnchorProvider): Promise<[anchor.web3.Keypair, anchor.web3.PublicKey]> => {
    const userSigner = new anchor.web3.Keypair;
    const user = userSigner.publicKey;

    const num_of_sol = 10;
    let userTx = await provider.connection.requestAirdrop(user, num_of_sol * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(userTx);

    return [userSigner, user];
}

const readTokenAccount = async (provider: anchor.AnchorProvider, accountPublicKey: anchor.web3.PublicKey): Promise<[spl.RawAccount, string]> => {

    const tokenInfoLol = await provider.connection.getAccountInfo(accountPublicKey);
    const accountInfo: spl.RawAccount = spl.AccountLayout.decode(tokenInfoLol.data);

    const amount = accountInfo.amount;
    return [accountInfo, amount.toString()];
}

const prereqs_setup_helper = async (provider: anchor.AnchorProvider, program: anchor.Program<DungeonNft>): Promise<State> => {
    let [beneficiarySigner, beneficiary] = await createUser(provider);
    let [playerSigner, player] = await createUser(provider);

    const tokenMint = await spl.createMint(provider.connection, beneficiarySigner, beneficiary, beneficiary, NUM_OF_DECIMALS);
    const solMint = spl.NATIVE_MINT;

    let beneficiaryTokenAssociatedTokenAccount = await createUserAssociatedTokenAccount(provider, beneficiary, beneficiarySigner, tokenMint, beneficiary, beneficiarySigner);
    let beneficiarySolAssociatedTokenAccount = await createUserAssociatedTokenAccount(provider, beneficiary, beneficiarySigner, solMint);

    let playerTokenAssociatedTokenAccount = await createUserAssociatedTokenAccount(provider, player, playerSigner, tokenMint, beneficiary, beneficiarySigner);
    let playerSolAssociatedTokenAccount = await createUserAssociatedTokenAccount(provider, player, playerSigner, solMint);

    let [marketState,] = await anchor.web3.PublicKey.findProgramAddress([anchor.utils.bytes.utf8.encode("market-state"), beneficiary.toBuffer()], program.programId);

    let [tokenVault,] = await anchor.web3.PublicKey.findProgramAddress([anchor.utils.bytes.utf8.encode("token-vault"), marketState.toBuffer(), beneficiary.toBuffer()], program.programId);
    let [solVault,] = await anchor.web3.PublicKey.findProgramAddress([anchor.utils.bytes.utf8.encode("sol-vault"), marketState.toBuffer(), beneficiary.toBuffer()], program.programId);

    return {
        tokenMint: tokenMint,
        solMint: solMint,

        beneficiary: beneficiary,
        beneficiarySigner: beneficiarySigner,
        beneficiaryTokenAssociatedTokenAccount: beneficiaryTokenAssociatedTokenAccount,
        beneficiarySolAssociatedTokenAccount: beneficiarySolAssociatedTokenAccount,

        player: player,
        playerSigner: playerSigner,
        playerTokenAssociatedTokenAccount: playerTokenAssociatedTokenAccount,
        playerSolAssociatedTokenAccount: playerSolAssociatedTokenAccount,

        marketState: marketState,
        tokenVault: tokenVault,
        solVault: solVault
    };
}

const initializeMarketHelper = async (state: State, program: anchor.Program<DungeonNft>): Promise<void> => {
    let fee_num = new anchor.BN(0);
    let fee_den = new anchor.BN(1000);

    const tx = await program.methods.ammSetupInstruction(fee_num, fee_den).accounts({
        tokenMint: state.tokenMint,
        solMint: state.solMint,

        marketState: state.marketState,

        tokenVault: state.tokenVault,
        solVault: state.solVault,

        beneficiary: state.beneficiary,

        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: spl.TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY
    }).signers([state.beneficiarySigner]).rpc();

    assert.ok(tx);
    console.log(`Initialized a new market with signature: ${tx}`);
}

const addLiquidityHelper = async (state: State, provider: anchor.AnchorProvider, program: Program<DungeonNft>): Promise<void> => {

    const [, preAdditionBeneficiaryTokenATABalance] = await readTokenAccount(provider, state.beneficiaryTokenAssociatedTokenAccount);
    assert.equal(preAdditionBeneficiaryTokenATABalance, 100 * 10 ** NUM_OF_DECIMALS);

    const [, preAdditionBeneficiarySolATABalance] = await readTokenAccount(provider, state.beneficiarySolAssociatedTokenAccount);
    assert.equal(preAdditionBeneficiarySolATABalance, 5 * anchor.web3.LAMPORTS_PER_SOL);

    const tokenAmount = new anchor.BN(50 * 10 ** NUM_OF_DECIMALS);
    const solAmount = new anchor.BN(2 * anchor.web3.LAMPORTS_PER_SOL);

    const tx = await program.methods.addLiquidityInstruction(tokenAmount, solAmount).accounts({
        marketState: state.marketState,
        tokenVault: state.tokenVault,
        solVault: state.solVault,
        beneficiary: state.beneficiary,
        beneficiaryTokenAta: state.beneficiaryTokenAssociatedTokenAccount,
        beneficiarySolAta: state.beneficiarySolAssociatedTokenAccount,
        tokenProgram: spl.TOKEN_PROGRAM_ID
    }).signers([state.beneficiarySigner]).rpc();

    const [, postAdditionBeneficiaryTokenATABalance] = await readTokenAccount(provider, state.beneficiaryTokenAssociatedTokenAccount);
    assert.equal(postAdditionBeneficiaryTokenATABalance, 50 * 10 ** NUM_OF_DECIMALS);

    const [, postAdditionBeneficiarySolATABalance] = await readTokenAccount(provider, state.beneficiarySolAssociatedTokenAccount);
    assert.equal(postAdditionBeneficiarySolATABalance, 3 * anchor.web3.LAMPORTS_PER_SOL);

    const [, postAdditionTokenVaultBalance] = await readTokenAccount(provider, state.tokenVault);
    assert.equal(postAdditionTokenVaultBalance, 50 * 10 ** NUM_OF_DECIMALS);

    const [, postAdditionSolVaultBalance] = await readTokenAccount(provider, state.solVault);
    assert.equal(postAdditionSolVaultBalance, 2 * anchor.web3.LAMPORTS_PER_SOL);

    assert.ok(tx);
    console.log(`Added Liquidity to the market with signature: ${tx}`);
}

const solToTokenHelper = async (state: State, provider: anchor.AnchorProvider, program: Program<DungeonNft>) => {
    const [, preSwapPlayerTokenATABalance] = await readTokenAccount(provider, state.playerTokenAssociatedTokenAccount);
    assert.equal(preSwapPlayerTokenATABalance, 100 * 10 ** NUM_OF_DECIMALS);

    const [, preSwapPlayerSolATABalance] = await readTokenAccount(provider, state.playerSolAssociatedTokenAccount);
    assert.equal(preSwapPlayerSolATABalance, 5 * anchor.web3.LAMPORTS_PER_SOL);

    const amount_in = new anchor.BN(anchor.web3.LAMPORTS_PER_SOL);

    const tx = await program.methods.swapTokensInstruction(amount_in, true).accounts({
        marketState: state.marketState,
        tokenVault: state.tokenVault,
        solVault: state.solVault,
        player: state.player,
        beneficiary: state.beneficiary,
        playerTokenAta: state.playerTokenAssociatedTokenAccount,
        playerSolAta: state.playerSolAssociatedTokenAccount,
        tokenProgram: spl.TOKEN_PROGRAM_ID
    }).signers([state.playerSigner]).rpc();

    const [, postSwapPlayerSolATABalance] = await readTokenAccount(provider, state.playerSolAssociatedTokenAccount);
    assert.equal(postSwapPlayerSolATABalance, 4 * anchor.web3.LAMPORTS_PER_SOL);

    const [, postSwapPlayerTokenATABalance] = await readTokenAccount(provider, state.playerTokenAssociatedTokenAccount);
    assert.equal(postSwapPlayerTokenATABalance, 116666666667);

    const [, postSwapSolVaultBalance] = await readTokenAccount(provider, state.solVault);
    assert.equal(postSwapSolVaultBalance, 3 * anchor.web3.LAMPORTS_PER_SOL);

    const [, postSwapTokenVaultBalance] = await readTokenAccount(provider, state.tokenVault);
    assert.equal(postSwapTokenVaultBalance, 33333333333);

    assert.ok(tx);
    console.log(`Swapped Sol to Token with signature: ${tx}`);
}

const tokenToSolHelper = async (state: State, provider: anchor.AnchorProvider, program: Program<DungeonNft>) => {
    const [, preSwapPlayerTokenATABalance] = await readTokenAccount(provider, state.playerTokenAssociatedTokenAccount);
    assert.equal(preSwapPlayerTokenATABalance, 116666666667);

    const [, preSwapPlayerSolATABalance] = await readTokenAccount(provider, state.playerSolAssociatedTokenAccount);
    assert.equal(preSwapPlayerSolATABalance, 4 * anchor.web3.LAMPORTS_PER_SOL);

    const amount_in = new anchor.BN(50 * 10 ** NUM_OF_DECIMALS);

    const tx = await program.methods.swapTokensInstruction(amount_in, false).accounts({
        marketState: state.marketState,
        tokenVault: state.tokenVault,
        solVault: state.solVault,
        player: state.player,
        beneficiary: state.beneficiary,
        playerTokenAta: state.playerTokenAssociatedTokenAccount,
        playerSolAta: state.playerSolAssociatedTokenAccount,
        tokenProgram: spl.TOKEN_PROGRAM_ID
    }).signers([state.playerSigner]).rpc();

    const [, postSwapPlayerSolATABalance] = await readTokenAccount(provider, state.playerSolAssociatedTokenAccount);
    assert.equal(postSwapPlayerSolATABalance, 5800000001);

    const [, postSwapPlayerTokenATABalance] = await readTokenAccount(provider, state.playerTokenAssociatedTokenAccount);
    assert.equal(postSwapPlayerTokenATABalance, 66666666667)

    const [, postSwapSolVaultBalance] = await readTokenAccount(provider, state.solVault);
    assert.equal(postSwapSolVaultBalance, 1199999999)

    const [, postSwapTokenVaultBalance] = await readTokenAccount(provider, state.tokenVault);
    assert.equal(postSwapTokenVaultBalance, 83333333333);

    assert.ok(tx);
    console.log(`Swapped Token to Sol with signature: ${tx}`);

}


describe("DungeonNFTAMMSolToToken", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);


    const program = anchor.workspace.DungeonNft as Program<DungeonNft>;
    // program.provider.connection.onLogs("all", ({ logs }) => { console.log(logs); });

    let state: State;

    it('can setup all the prereqs', async () => {
        state = await prereqs_setup_helper(provider, program);
    })

    it('can initialize the market', async () => {
        await initializeMarketHelper(state, program);
    })

    it('can add liquidity in the market pool', async () => {
        await addLiquidityHelper(state, provider, program);
    })

    it('can add swap sol to tokens', async () => {
        await solToTokenHelper(state, provider, program);
        await tokenToSolHelper(state, provider, program);
    })

})
