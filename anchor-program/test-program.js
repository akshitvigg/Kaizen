const anchor = require('@coral-xyz/anchor');
const { PublicKey, Connection } = require('@solana/web3.js');

async function testProgram() {
  const PROGRAM_ID = new PublicKey('as6C6SkX7KmKZ3XjELQSpiTHSk7xXnt1AK8h1y2XwYJ');
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // Load the IDL
  const idl = require('./anchor-program/target/idl/deepwork.json');
  
  // Create a dummy wallet for testing
  const wallet = {
    publicKey: new PublicKey('6SYo2K2yQTJwoKEq3H7743yyDgAniZvNjA39zqsegSzi'),
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs,
  };
  
  const provider = new anchor.AnchorProvider(connection, wallet, {
    preflightCommitment: 'confirmed',
    commitment: 'confirmed',
  });
  
  const program = new anchor.Program(idl, PROGRAM_ID, provider);
  
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
    console.log('Global state exists:', globalState);
  } catch (error) {
    console.log('Global state does not exist:', error.message);
  }
}

testProgram().catch(console.error);
