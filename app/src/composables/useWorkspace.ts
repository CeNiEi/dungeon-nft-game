import { computed, ComputedRef, Ref } from 'vue'
import { AnchorWallet, useAnchorWallet, useWallet } from 'solana-wallets-vue'
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js'
import { AnchorProvider, Idl, Program, web3 } from '@project-serum/anchor'
import idl from '../../../target/idl/dungeon_nft.json'
import { createInitializeMintInstruction, getMinimumBalanceForRentExemptMint, MINT_SIZE, TOKEN_PROGRAM_ID } from '@solana/spl-token'

const programID = new PublicKey(idl.metadata.address)

interface Workspace {
    wallet: Ref<AnchorWallet | undefined>,
    connection: Connection,
    provider: ComputedRef<AnchorProvider>
    program: ComputedRef<Program<Idl>>,
}

let workspace: Workspace;

export const useWorkspace = () => workspace

// only for testing on loclanet
export const createCENIEI = async (provider: AnchorProvider, creator: web3.PublicKey): Promise<web3.PublicKey> => {
    const rentExemptLamports = await getMinimumBalanceForRentExemptMint(provider.connection);
    const newMint = web3.Keypair.generate();

    const tx = new web3.Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: creator,
            newAccountPubkey: newMint.publicKey,
            space: MINT_SIZE,
            lamports: rentExemptLamports,
            programId: TOKEN_PROGRAM_ID
        }),
        createInitializeMintInstruction(newMint.publicKey, 9, creator, creator)
    );

    const txSignature = await provider.sendAndConfirm(tx, [newMint]);

    console.log(`CENIEI created with signature: ${txSignature}`)
    return newMint.publicKey;
}

export const initWorkspace = () => {
    const wallet = useAnchorWallet();

    const connection = new Connection('http://127.0.0.1:8899')
    const provider = computed(() => new AnchorProvider(connection, wallet.value!, {}))
    const program = computed(() => new Program(idl as unknown as Idl, programID, provider.value))

    workspace = {
        wallet,
        connection,
        provider,
        program,
    }
}