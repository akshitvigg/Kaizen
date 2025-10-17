
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Deepwork } from "../target/types/deepwork";
import { assert } from "chai";

describe("deepwork - minimal tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Deepwork as Program<Deepwork>;

  let globalStatePda: anchor.web3.PublicKey;
  let vaultPda: anchor.web3.PublicKey;

  before(async () => {
    [globalStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("global_state")],
      program.programId
    );

    [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), globalStatePda.toBuffer()],
      program.programId
    );
  });

  it("initializes the program", async () => {
    const authority = provider.wallet;
    await program.methods
      .initialize()
      .accounts({
        globalState: globalStatePda,
        vault: vaultPda,
        authority: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const globalState = await program.account.globalState.fetch(globalStatePda);
    assert.equal(globalState.totalSessions.toNumber(), 0);
  });

  it("starts and completes a focus session", async () => {
    const user = anchor.web3.Keypair.generate(); // fresh user for uniqueness
    const [userStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user_state"), user.publicKey.toBuffer()],
      program.programId
    );

    await provider.connection.requestAirdrop(user.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
      .then(sig => provider.connection.confirmTransaction(sig));

    await program.methods
      .startFocusSession(new anchor.BN(100_000_000), new anchor.BN(25))
      .accounts({
        userState: userStatePda,
        globalState: globalStatePda,
        vault: vaultPda,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    let userState = await program.account.userState.fetch(userStatePda);
    assert.equal(userState.isActive, true);

    await program.methods
      .failFocusSession()
      .accounts({
        userState: userStatePda,
        globalState: globalStatePda,
        user: user.publicKey,
      })
      .signers([user])
      .rpc();

    userState = await program.account.userState.fetch(userStatePda);
    assert.equal(userState.isActive, false);
  });

  it("rejects stake below minimum", async () => {
    const user = anchor.web3.Keypair.generate();
    const [userStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user_state"), user.publicKey.toBuffer()],
      program.programId
    );

    await provider.connection.requestAirdrop(user.publicKey, 1 * anchor.web3.LAMPORTS_PER_SOL)
      .then(sig => provider.connection.confirmTransaction(sig));

    try {
      await program.methods
        .startFocusSession(new anchor.BN(5_000_000), new anchor.BN(25))
        .accounts({
          userState: userStatePda,
          globalState: globalStatePda,
          vault: vaultPda,
          user: user.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc();
      assert.fail("Should have thrown error");
    } catch (err: any) {
      assert.include(err.toString(), "StakeTooLow");
    }
  });

  it("rejects invalid duration", async () => {
    const user = anchor.web3.Keypair.generate();
    const [userStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user_state"), user.publicKey.toBuffer()],
      program.programId
    );

    await provider.connection.requestAirdrop(user.publicKey, 1 * anchor.web3.LAMPORTS_PER_SOL)
      .then(sig => provider.connection.confirmTransaction(sig));

    try {
      await program.methods
        .startFocusSession(new anchor.BN(50_000_000), new anchor.BN(500))
        .accounts({
          userState: userStatePda,
          globalState: globalStatePda,
          vault: vaultPda,
          user: user.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc();
      assert.fail("Should have thrown error");
    } catch (err: any) {
      assert.include(err.toString(), "InvalidDuration");
    }
  });
});
