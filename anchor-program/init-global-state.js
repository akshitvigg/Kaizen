const { Connection, PublicKey, Transaction, SystemProgram } = require('@solana/web3.js');
const { AnchorProvider, Program } = require('@coral-xyz/anchor');
const fs = require('fs');

async function initializeGlobalState() {
  const PROGRAM_ID = new PublicKey('as6C6SkX7KmKZ3XjELQSpiTHSk7xXnt1AK8h1y2XwYJ');
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // Load the IDL
  const idl = JSON.parse(fs.readFileSync('./anchor-program/target/idl/deepwork.json', 'utf8'));
  
  // Create a dummy wallet for testing
  const wallet = {
    publicKey: new PublicKey('6SYo2K2yQTJwoKEq3H7743yyDgAniZvNjA39zqsegSzi'),
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs,
  };
  
  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: 'confirmed',
    commitment: 'confirmed',
  });
  
  // Create program with the correct IDL but override the program ID
  const program = new Program(idl, PROGRAM_ID, provider);
  
  console.log('Program ID:', program.programId.toString());
  console.log('IDL address:', idl.address);
  
  // Try to get the global state PDA
  const [globalStatePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('global_state')],
    PROGRAM_ID
  );
  
  console.log('Global State PDA:', globalStatePDA.toString());
  
  try {
    const globalState = await program.account.globalState.fetch(globalStatePDA);
    console.log('Global state already exists:', globalState);
  } catch (error) {
    console.log('Global state does not exist, trying to initialize...');
    
    try {
      const [vaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), globalStatePDA.toBuffer()],
        PROGRAM_ID
      );
      
      const [focusPoolVaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('focus_pool_vault'), globalStatePDA.toBuffer()],
        PROGRAM_ID
      );
      
      const [failurePoolVaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('failure_pool_vault'), globalStatePDA.toBuffer()],
        PROGRAM_ID
      );
      
      console.log('Vault PDA:', vaultPDA.toString());
      console.log('Focus Pool Vault PDA:', focusPoolVaultPDA.toString());
      console.log('Failure Pool Vault PDA:', failurePoolVaultPDA.toString());
      
      // Try to initialize
      const tx = await program.methods
        .initialize()
        .accounts({
          globalState: globalStatePDA,
          vault: vaultPDA,
          focusPoolVault: focusPoolVaultPDA,
          failurePoolVault: failurePoolVaultPDA,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      console.log('✅ Global state initialized successfully!');
      console.log('Transaction signature:', tx);
    } catch (initError) {
      console.error('❌ Error initializing global state:', initError);
    }
  }
}

initializeGlobalState().catch(console.error);
