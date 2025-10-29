import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';

// Import the IDL from within the frontend so it can be bundled by Vercel.
// Place the generated deepwork.json at `frontend/lib/idl/deepwork.json`.
// Type is `any` to avoid tight coupling with generated types.
// eslint-disable-next-line @typescript-eslint/no-var-requires
import IDL from '@/lib/idl/deepwork.json';

export const PROGRAM_ID = new PublicKey('as6C6SkX7KmKZ3XjELQSpiTHSk7xXnt1AK8h1y2XwYJ');

export const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

export type DeepworkProgram = Program<any>;

export function createProgram(provider: AnchorProvider): DeepworkProgram {
  return new Program(IDL, provider);
}

export function getProvider(wallet: Wallet): AnchorProvider {
  return new AnchorProvider(connection, wallet, {
    preflightCommitment: 'confirmed',
    commitment: 'confirmed',
  });
}

export const GLOBAL_STATE_SEED = 'global_state';
export const USER_STATE_SEED = 'user_state';
export const VAULT_SEED = 'vault';
export const FOCUS_POOL_VAULT_SEED = 'focus_pool_vault';
export const FAILURE_POOL_VAULT_SEED = 'failure_pool_vault';

export function getGlobalStatePDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from(GLOBAL_STATE_SEED)], PROGRAM_ID);
}

export function getUserStatePDA(user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from(USER_STATE_SEED), user.toBuffer()], PROGRAM_ID);
}

export function getVaultPDA(globalState: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from(VAULT_SEED), globalState.toBuffer()], PROGRAM_ID);
}

export function getFocusPoolVaultPDA(globalState: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from(FOCUS_POOL_VAULT_SEED), globalState.toBuffer()], PROGRAM_ID);
}

export function getFailurePoolVaultPDA(globalState: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from(FAILURE_POOL_VAULT_SEED), globalState.toBuffer()], PROGRAM_ID);
}

export function lamportsToSol(lamports: number): number {
  return lamports / 1e9;
}

export function solToLamports(sol: number): number {
  return Math.floor(sol * 1e9);
}

export const MIN_STAKE_LAMPORTS = 10_000_000;
export const MIN_STAKE_SOL = lamportsToSol(MIN_STAKE_LAMPORTS);
