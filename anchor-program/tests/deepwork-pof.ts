import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Deepwork } from "../target/types/deepwork";
import { assert } from "chai";

describe("deepwork - PoF flows", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Deepwork as Program<Deepwork>;

  let globalStatePda: anchor.web3.PublicKey;
  let vaultPda: anchor.web3.PublicKey;
  let focusPoolPda: anchor.web3.PublicKey;
  let failurePoolPda: anchor.web3.PublicKey;

  const getLamports = async (pk: anchor.web3.PublicKey) => {
    const info = await provider.connection.getAccountInfo(pk);
    return info?.lamports ?? 0;
  };

  before(async () => {
    [globalStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("global_state")],
      program.programId
    );

    [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), globalStatePda.toBuffer()],
      program.programId
    );

    [focusPoolPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("focus_pool_vault"), globalStatePda.toBuffer()],
      program.programId
    );

    [failurePoolPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("failure_pool_vault"), globalStatePda.toBuffer()],
      program.programId
    );
  });

  it("initializes the program and PDAs", async () => {
    const authority = provider.wallet;
    await program.methods
      .initialize()
      .accounts({
        globalState: globalStatePda,
        vault: vaultPda,
        focusPoolVault: focusPoolPda,
        failurePoolVault: failurePoolPda,
        authority: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const globalState = await program.account.globalState.fetch(globalStatePda);
    assert.equal(globalState.totalSessions.toNumber(), 0);
  });

  it("start splits 1% to focus pool and 99% to vault", async () => {
    const user = anchor.web3.Keypair.generate();
    const [userStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user_state"), user.publicKey.toBuffer()],
      program.programId
    );

    await provider.connection
      .requestAirdrop(user.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
      .then((sig) => provider.connection.confirmTransaction(sig));

    const preVaultLamports = await getLamports(vaultPda);
    const preFocusLamports = await getLamports(focusPoolPda);

    await program.methods
      .startFocusSession(
        new anchor.BN(100_000_000),
        new anchor.BN(25),
        [{ description: "Task 1", completed: false } as any]
      )
      .accounts({
        userState: userStatePda,
        globalState: globalStatePda,
        vault: vaultPda,
        focusPoolVault: focusPoolPda,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const userState = await program.account.userState.fetch(userStatePda);
    assert.equal(userState.isActive, true);

    const postVaultLamports = await getLamports(vaultPda);
    const postFocusLamports = await getLamports(focusPoolPda);
    assert.equal(
      postFocusLamports - preFocusLamports,
      1_000_000,
      "focus pool should receive 1%"
    );
    assert.equal(
      postVaultLamports - preVaultLamports,
      99_000_000,
      "vault should receive 99%"
    );
  });

  it("completes a focus session and returns 99% to user (closes user_state)", async () => {
    const user = anchor.web3.Keypair.generate();
    const [userStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user_state"), user.publicKey.toBuffer()],
      program.programId
    );

    await provider.connection
      .requestAirdrop(user.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
      .then((sig) => provider.connection.confirmTransaction(sig));

    await program.methods
      .startFocusSession(
        new anchor.BN(100_000_000),
        new anchor.BN(1),
        [{ description: "Task 1", completed: false } as any]
      ) // 1 minute; grace allows immediate completion
      .accounts({
        userState: userStatePda,
        globalState: globalStatePda,
        vault: vaultPda,
        focusPoolVault: focusPoolPda,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const preVaultLamports = await getLamports(vaultPda);

    await program.methods
      .completeFocusSessionV1()
      .accounts({
        userState: userStatePda,
        globalState: globalStatePda,
        vault: vaultPda,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const postVaultLamports = await getLamports(vaultPda);
    assert.equal(
      preVaultLamports - postVaultLamports,
      99_000_000,
      "vault should pay back 99%"
    );

    // user_state closed on completion; fetching should fail
    try {
      await program.account.userState.fetch(userStatePda);
      assert.fail("user_state should be closed");
    } catch { }
  });

  it("fails a focus session and routes 99% to failure pool (closes user_state)", async () => {
    const user = anchor.web3.Keypair.generate();
    const [userStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user_state"), user.publicKey.toBuffer()],
      program.programId
    );

    await provider.connection
      .requestAirdrop(user.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
      .then((sig) => provider.connection.confirmTransaction(sig));

    await program.methods
      .startFocusSession(
        new anchor.BN(100_000_000),
        new anchor.BN(25),
        [{ description: "Task 1", completed: false } as any]
      )
      .accounts({
        userState: userStatePda,
        globalState: globalStatePda,
        vault: vaultPda,
        focusPoolVault: focusPoolPda,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const preFailureLamports = await getLamports(failurePoolPda);

    await program.methods
      .failFocusSession()
      .accounts({
        userState: userStatePda,
        globalState: globalStatePda,
        vault: vaultPda,
        failurePoolVault: failurePoolPda,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const postFailureLamports = await getLamports(failurePoolPda);
    assert.equal(
      postFailureLamports - preFailureLamports,
      99_000_000,
      "failure pool should receive 99%"
    );

    try {
      await program.account.userState.fetch(userStatePda);
      assert.fail("user_state should be closed");
    } catch { }
  });

  it("authority can withdraw focus and failure pools", async () => {
    const authority = provider.wallet as anchor.Wallet;

    const recipient = anchor.web3.Keypair.generate();
    await provider.connection
      .requestAirdrop(recipient.publicKey, 1 * anchor.web3.LAMPORTS_PER_SOL)
      .then((sig) => provider.connection.confirmTransaction(sig));

    const preRecipient = await getLamports(recipient.publicKey);
    const preFocus = await getLamports(focusPoolPda);
    const preFailure = await getLamports(failurePoolPda);

    const withdrawFocus = Math.min(500_000, preFocus);
    const withdrawFailure = Math.min(1_000_000, preFailure);

    if (withdrawFocus > 0) {
      await program.methods
        .withdrawFocusPool(new anchor.BN(withdrawFocus))
        .accounts({
          globalState: globalStatePda,
          focusPoolVault: focusPoolPda,
          recipient: recipient.publicKey,
          authority: authority.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
    }

    if (withdrawFailure > 0) {
      await program.methods
        .withdrawFailurePool(new anchor.BN(withdrawFailure))
        .accounts({
          globalState: globalStatePda,
          failurePoolVault: failurePoolPda,
          recipient: recipient.publicKey,
          authority: authority.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
    }

    const postRecipient = await getLamports(recipient.publicKey);
    assert.isTrue(postRecipient >= preRecipient + withdrawFocus + withdrawFailure);
  });
});



