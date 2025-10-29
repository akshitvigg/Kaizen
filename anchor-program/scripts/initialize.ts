import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Deepwork } from '../target/types/deepwork';
import { PublicKey } from '@solana/web3.js';

async function initializeGlobalState() {
  // Use the same program ID as in your frontend
  const PROGRAM_ID = new PublicKey('as6C6SkX7KmKZ3XjELQSpiTHSk7xXnt1AK8h1y2XwYJ');
  
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Deepwork as Program<Deepwork>;

  const [globalStatePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('global_state')],
    PROGRAM_ID
  );

  console.log('Program ID:', PROGRAM_ID.toString());
  console.log('Global State PDA:', globalStatePDA.toString());
  console.log('Authority:', provider.wallet.publicKey.toString());

  console.log('Initializing global state...');
  try {
    const tx = await program.methods
      .initialize()
      .accounts({
        globalState: globalStatePDA,
        vault: PublicKey.findProgramAddressSync(
          [Buffer.from('vault'), globalStatePDA.toBuffer()],
          PROGRAM_ID
        )[0],
        focusPoolVault: PublicKey.findProgramAddressSync(
          [Buffer.from('focus_pool_vault'), globalStatePDA.toBuffer()],
          PROGRAM_ID
        )[0],
        failurePoolVault: PublicKey.findProgramAddressSync(
          [Buffer.from('failure_pool_vault'), globalStatePDA.toBuffer()],
          PROGRAM_ID
        )[0],
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log('✅ Global state initialized successfully!');
    console.log('Transaction signature:', tx);
  } catch (error) {
    console.error('❌ Error initializing global state:', error);
    
    // Check if the account already exists
    try {
      const globalState = await program.account.globalState.fetch(globalStatePDA);
      console.log('✅ Global state already initialized:', globalState);
    } catch (fetchError) {
      console.error('❌ Could not fetch global state:', fetchError);
    }
  }
}

initializeGlobalState().catch(console.error);
