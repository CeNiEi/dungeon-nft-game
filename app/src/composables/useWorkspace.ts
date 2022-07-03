import { computed, ComputedRef, Ref } from 'vue';
import { AnchorWallet, useAnchorWallet } from 'solana-wallets-vue';
import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Idl, Program } from '@project-serum/anchor';
import idl from '../../../target/idl/dungeon_nft.json';

const programID = new PublicKey(idl.metadata.address);

interface Workspace {
  wallet: Ref<AnchorWallet | undefined>;
  connection: Connection;
  provider: ComputedRef<AnchorProvider>;
  program: ComputedRef<Program<Idl>>;
}

let workspace: Workspace;

export const useWorkspace = () => workspace;

export const initWorkspace = () => {
  const wallet = useAnchorWallet();

  const connection = new Connection('http://127.0.0.1:8899');
  const provider = computed(
    () => new AnchorProvider(connection, wallet.value!, {})
  );
  const program = computed(
    () => new Program(idl as unknown as Idl, programID, provider.value)
  );

  workspace = {
    wallet,
    connection,
    provider,
    program,
  };
};
