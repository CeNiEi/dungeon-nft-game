import { useWorkspace, createCENIEI } from 'src/composables'
import { AnchorProvider, web3 } from '@project-serum/anchor';
import { AccountLayout, createAssociatedTokenAccountInstruction, createSyncNativeInstruction, getAssociatedTokenAddress, NATIVE_MINT } from '@solana/spl-token';


export const fetchTokenAccountBalance = async (provider: AnchorProvider, accountPublicKey: web3.PublicKey): Promise<bigint | null> => {
    const tokenInfoLol = await provider.connection.getAccountInfo(accountPublicKey);
    if (tokenInfoLol === null) {
        return null;
    }
    return AccountLayout.decode(tokenInfoLol.data).amount;
}

export const createATA = async (user: web3.PublicKey, userATA: web3.PublicKey, mint: web3.PublicKey, provider: AnchorProvider): Promise<void> => {
    const tx = new web3.Transaction().add(
        createAssociatedTokenAccountInstruction(
            user,
            userATA,
            user,
            mint
        ));

    const txSignature = await provider.sendAndConfirm(tx);
    console.log(`Created a new ATA with signature: ${txSignature}`);
}

export const fundWrappedSolATA = async (user: web3.PublicKey, amount: number, provider: AnchorProvider, userATA: web3.PublicKey): Promise<void> => {
    const tx = new web3.Transaction().add(
        web3.SystemProgram.transfer({
            fromPubkey: user,
            toPubkey: userATA,
            lamports: amount * web3.LAMPORTS_PER_SOL
        }),
        createSyncNativeInstruction(userATA)
    );

    const txSignature = await provider.sendAndConfirm(tx);
    console.log(`Funded the ATA with ${amount} SOL: ${txSignature}`)
}

export const getATA = async (sol: boolean): Promise<bigint> => {
    const { wallet, provider } = useWorkspace();
    const user = wallet.value?.publicKey;

    if(user === undefined) {
        throw "Wallet Undefined";
    }

    // need to change in devnet
    const mint = sol ? NATIVE_MINT : await createCENIEI(provider.value, user);

    const userATA = await getAssociatedTokenAddress(mint, user);
    const balanceRes = await fetchTokenAccountBalance(provider.value, userATA);

    if (balanceRes === null) {
        console.log('ATA does note exists')
        return BigInt(-1);
    }

    const tokenName = sol ? 'SOL' : 'CENIEI';
    console.log(`${tokenName} balance: ${balanceRes.toString()}`);
    return balanceRes;
}

