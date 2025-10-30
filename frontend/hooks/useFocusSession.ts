import { useState, useEffect, useCallback, useRef } from 'react';
import { PublicKey, Transaction, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { AnchorProvider, BN, Wallet } from '@coral-xyz/anchor';
import { useWallet } from '../app/components/wallet/WalletProvider';
import { 
  createProgram, 
  getProvider, 
  getGlobalStatePDA, 
  getUserStatePDA, 
  getVaultPDA, 
  getFocusPoolVaultPDA, 
  getFailurePoolVaultPDA,
  lamportsToSol,
  solToLamports,
  MIN_STAKE_LAMPORTS
} from '../lib/program';

export interface Task {
  description: string;
  completed: boolean;
}

export interface UserState {
  user: PublicKey;
  isActive: boolean;
  stakeAmount: number;
  startTime: number;
  durationMinutes: number;
  pendingBalance: number;
  tasks: Task[];
}

export interface GlobalState {
  authority: PublicKey;
  focusPool: number;
  failurePool: number;
  totalSessions: number;
  vaultBump: number;
  focusPoolBump: number;
  failurePoolBump: number;
}

export function useFocusSession(externalRefreshKey?: any) {
  // Prevent duplicate submissions
  const inFlightRef = useRef<{ start: boolean; complete: boolean; fail: boolean; claim: boolean }>({
    start: false,
    complete: false,
    fail: false,
    claim: false,
  });

  const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
  const makeMemoIx = (note: string) =>
    new TransactionInstruction({ keys: [], programId: MEMO_PROGRAM_ID, data: Buffer.from(note) });

  const { address } = useWallet();
  const [userState, setUserState] = useState<UserState | null>(null);
  const [globalState, setGlobalState] = useState<GlobalState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get wallet provider
  const getWalletProvider = useCallback(() => {
    if (!address) return null;
    
    const anyWindow: any = window;
    const provider = anyWindow?.solana;
    if (!provider) return null;

    return {
      publicKey: new PublicKey(address),
      signTransaction: async (tx: Transaction) => {
        const signed = await provider.signTransaction(tx);
        return signed;
      },
      signAllTransactions: async (txs: Transaction[]) => {
        const signed = await provider.signAllTransactions(txs);
        return signed;
      },
    } as Wallet;
  }, [address]);

  // Fetch user state
  const fetchUserState = useCallback(async () => {
    if (!address) {
      setUserState(null);
      return;
    }

    try {
      const wallet = getWalletProvider();
      if (!wallet) return;

      const provider = getProvider(wallet);
      const program = createProgram(provider);
      const userPubkey = new PublicKey(address);
      const [userStatePDA] = getUserStatePDA(userPubkey);

      try {
        const userStateAccount = await (program.account as any).userState.fetch(userStatePDA);
        setUserState({
          user: userStateAccount.user,
          isActive: userStateAccount.isActive,
          stakeAmount: userStateAccount.stakeAmount.toNumber(),
          startTime: userStateAccount.startTime.toNumber(),
          durationMinutes: userStateAccount.durationMinutes.toNumber(),
          pendingBalance: userStateAccount.pendingBalance.toNumber(),
          tasks: userStateAccount.tasks.map((t: any) => ({
            description: t.description,
            completed: t.completed,
          })),
        });
      } catch (err) {
        // Account doesn't exist yet
        setUserState(null);
      }
    } catch (err) {
      console.error('Error fetching user state:', err);
      setError('Failed to fetch user state');
    }
  }, [address, getWalletProvider]);

  // Fetch global state
  const fetchGlobalState = useCallback(async () => {
    try {
      const wallet = getWalletProvider();
      if (!wallet) return;

      const provider = getProvider(wallet);
      const program = createProgram(provider);
      const [globalStatePDA] = getGlobalStatePDA();

      try {
        const globalStateAccount = await (program.account as any).globalState.fetch(globalStatePDA);
        setGlobalState({
          authority: globalStateAccount.authority,
          focusPool: globalStateAccount.focusPool.toNumber(),
          failurePool: globalStateAccount.failurePool.toNumber(),
          totalSessions: globalStateAccount.totalSessions.toNumber(),
          vaultBump: globalStateAccount.vaultBump,
          focusPoolBump: globalStateAccount.focusPoolBump,
          failurePoolBump: globalStateAccount.failurePoolBump,
        });
      } catch (err) {
        console.error('Error fetching global state:', err);
        setError('Failed to fetch global state');
      }
    } catch (err) {
      console.error('Error fetching global state:', err);
      setError('Failed to fetch global state');
    }
  }, [getWalletProvider]);

  // Start focus session
  const startFocusSession = useCallback(async (stakeAmountSol: number, durationMinutes: number, tasks: Task[]) => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    const stakeAmountLamports = solToLamports(stakeAmountSol);
    if (stakeAmountLamports < MIN_STAKE_LAMPORTS) {
      setError(`Minimum stake is ${lamportsToSol(MIN_STAKE_LAMPORTS)} SOL`);
      return false;
    }

    if (durationMinutes <= 0 || durationMinutes > 480) {
      setError('Duration must be between 1 and 480 minutes');
      return false;
    }

    if (tasks.length === 0) {
      setError('Please add at least one task');
      return false;
    }

    if (tasks.length > 20) {
      setError('Maximum 20 tasks allowed');
      return false;
    }

    if (inFlightRef.current.start) return false;
    inFlightRef.current.start = true;
    setLoading(true);
    setError(null);

    try {
      const wallet = getWalletProvider();
      if (!wallet) {
        setError('Wallet not available');
        return false;
      }

      const provider = getProvider(wallet);
      const program = createProgram(provider);
      const userPubkey = new PublicKey(address);
      
      const [userStatePDA] = getUserStatePDA(userPubkey);
      const [globalStatePDA] = getGlobalStatePDA();
      const [vaultPDA] = getVaultPDA(globalStatePDA);
      const [focusPoolVaultPDA] = getFocusPoolVaultPDA(globalStatePDA);

      const tx = await (program.methods as any)
        .startFocusSession(new BN(stakeAmountLamports), new BN(durationMinutes), tasks)
        .preInstructions([makeMemoIx((globalThis as any).crypto?.randomUUID?.() || Math.random().toString(36))])
        .accounts({
          userState: userStatePDA,
          globalState: globalStatePDA,
          vault: vaultPDA,
          focusPoolVault: focusPoolVaultPDA,
          user: userPubkey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Focus session started:', tx);
      await fetchUserState();
      await fetchGlobalState();
      return true;
    } catch (err: any) {
      console.error('Error starting focus session:', err);
      const msg: string = err?.message || '';
      if (msg.includes('already been processed')) {
        await fetchUserState();
        await fetchGlobalState();
        setError(null);
        return true;
      }
      setError(err.message || 'Failed to start focus session');
      return false;
    } finally {
      setLoading(false);
      inFlightRef.current.start = false;
    }
  }, [address, getWalletProvider, fetchUserState, fetchGlobalState]);

  // Complete focus session
  const completeFocusSession = useCallback(async () => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    if (inFlightRef.current.complete) return false;
    inFlightRef.current.complete = true;
    setLoading(true);
    setError(null);

    try {
      const wallet = getWalletProvider();
      if (!wallet) {
        setError('Wallet not available');
        return false;
      }

      const provider = getProvider(wallet);
      const program = createProgram(provider);
      const userPubkey = new PublicKey(address);
      
      const [userStatePDA] = getUserStatePDA(userPubkey);
      const [globalStatePDA] = getGlobalStatePDA();
      const [vaultPDA] = getVaultPDA(globalStatePDA);

      const tx = await (program.methods as any)
        .completeFocusSession()
        .preInstructions([makeMemoIx((globalThis as any).crypto?.randomUUID?.() || Math.random().toString(36))])
        .accounts({
          userState: userStatePDA,
          globalState: globalStatePDA,
          vault: vaultPDA,
          user: userPubkey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Focus session completed:', tx);
      await fetchUserState();
      await fetchGlobalState();
      return true;
    } catch (err: any) {
      console.error('Error completing focus session:', err);
      const msg: string = err?.message || '';
      if (msg.includes('already been processed')) {
        await fetchUserState();
        await fetchGlobalState();
        setError(null);
        return true;
      }
      setError(err.message || 'Failed to complete focus session');
      return false;
    } finally {
      setLoading(false);
      inFlightRef.current.complete = false;
    }
  }, [address, getWalletProvider, fetchUserState, fetchGlobalState]);

  // Fail focus session
  const failFocusSession = useCallback(async () => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    if (inFlightRef.current.fail) return false;
    inFlightRef.current.fail = true;
    setLoading(true);
    setError(null);

    try {
      const wallet = getWalletProvider();
      if (!wallet) {
        setError('Wallet not available');
        return false;
      }

      const provider = getProvider(wallet);
      const program = createProgram(provider);
      const userPubkey = new PublicKey(address);
      
      const [userStatePDA] = getUserStatePDA(userPubkey);
      const [globalStatePDA] = getGlobalStatePDA();
      const [vaultPDA] = getVaultPDA(globalStatePDA);
      const [failurePoolVaultPDA] = getFailurePoolVaultPDA(globalStatePDA);

      const tx = await (program.methods as any)
        .failFocusSession()
        .preInstructions([makeMemoIx((globalThis as any).crypto?.randomUUID?.() || Math.random().toString(36))])
        .accounts({
          userState: userStatePDA,
          globalState: globalStatePDA,
          vault: vaultPDA,
          failurePoolVault: failurePoolVaultPDA,
          user: userPubkey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Focus session failed:', tx);
      await fetchUserState();
      await fetchGlobalState();
      return true;
    } catch (err: any) {
      console.error('Error failing focus session:', err);
      const msg: string = err?.message || '';
      if (msg.includes('already been processed')) {
        await fetchUserState();
        await fetchGlobalState();
        setError(null);
        return true;
      }
      setError(err.message || 'Failed to fail focus session');
      return false;
    } finally {
      setLoading(false);
      inFlightRef.current.fail = false;
    }
  }, [address, getWalletProvider, fetchUserState, fetchGlobalState]);

  // Claim rewards
  const claimRewards = useCallback(async () => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    if (inFlightRef.current.claim) return false;
    inFlightRef.current.claim = true;
    setLoading(true);
    setError(null);

    try {
      const wallet = getWalletProvider();
      if (!wallet) {
        setError('Wallet not available');
        return false;
      }

      const provider = getProvider(wallet);
      const program = createProgram(provider);
      const userPubkey = new PublicKey(address);
      
      const [userStatePDA] = getUserStatePDA(userPubkey);
      const [globalStatePDA] = getGlobalStatePDA();
      const [vaultPDA] = getVaultPDA(globalStatePDA);
      const [failurePoolVaultPDA] = getFailurePoolVaultPDA(globalStatePDA);

      const tx = await (program.methods as any)
        .claimRewards()
        .preInstructions([makeMemoIx((globalThis as any).crypto?.randomUUID?.() || Math.random().toString(36))])
        .accounts({
          userState: userStatePDA,
          globalState: globalStatePDA,
          vault: vaultPDA,
          failurePoolVault: failurePoolVaultPDA,
          user: userPubkey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Rewards claimed:', tx);
      await fetchGlobalState();
      setUserState(null); // User state is closed after claim
      return true;
    } catch (err: any) {
      console.error('Error claiming rewards:', err);
      const msg: string = err?.message || '';
      if (msg.includes('already been processed')) {
        await fetchGlobalState();
        setUserState(null);
        setError(null);
        return true;
      }
      setError(err.message || 'Failed to claim rewards');
      return false;
    } finally {
      setLoading(false);
      inFlightRef.current.claim = false;
    }
  }, [address, getWalletProvider, fetchGlobalState]);

  // Update task
  const updateTask = useCallback(async (taskIndex: number, completed: boolean) => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const wallet = getWalletProvider();
      if (!wallet) {
        setError('Wallet not available');
        return false;
      }

      const provider = getProvider(wallet);
      const program = createProgram(provider);
      const userPubkey = new PublicKey(address);
      
      const [userStatePDA] = getUserStatePDA(userPubkey);

      const tx = await (program.methods as any)
        .updateTask(taskIndex, completed)
        .accounts({
          userState: userStatePDA,
          user: userPubkey,
        })
        .rpc();

      console.log('Task updated:', tx);
      await fetchUserState();
      return true;
    } catch (err: any) {
      console.error('Error updating task:', err);
      setError(err.message || 'Failed to update task');
      return false;
    } finally {
      setLoading(false);
    }
  }, [address, getWalletProvider, fetchUserState]);

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([fetchUserState(), fetchGlobalState()]);
  }, [fetchUserState, fetchGlobalState]);

  // Auto-refresh when address changes
  useEffect(() => {
    refresh();
  }, [refresh, externalRefreshKey]);

  return {
    userState,
    globalState,
    loading,
    error,
    startFocusSession,
    completeFocusSession,
    failFocusSession,
    claimRewards,
    updateTask,
    refresh,
  };
}
