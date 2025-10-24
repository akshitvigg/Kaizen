use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("5C6FGUgM3o2gULHhcRu1TnoHcKLVvezxZZThZTJiwqrM");

#[program]
pub mod deepwork {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let global_state = &mut ctx.accounts.global_state;
        global_state.authority = ctx.accounts.authority.key();
        global_state.focus_pool = 0;
        global_state.failure_pool = 0;
        global_state.total_sessions = 0;
        global_state.vault_bump = ctx.bumps.vault;
        global_state.focus_pool_bump = ctx.bumps.focus_pool_vault;
        global_state.failure_pool_bump = ctx.bumps.failure_pool_vault;

        let rent_lamports = Rent::get()?.minimum_balance(0);

        if ctx.accounts.vault.lamports() == 0 {
            let vault_key = ctx.accounts.vault.key();
            let create_vault_ix = anchor_lang::solana_program::system_instruction::create_account(
                &ctx.accounts.authority.key(),
                &vault_key,
                rent_lamports,
                0,
                ctx.program_id,
            );
            anchor_lang::solana_program::program::invoke_signed(
                &create_vault_ix,
                &[
                    ctx.accounts.authority.to_account_info(),
                    ctx.accounts.vault.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
                &[&[b"vault", global_state.key().as_ref(), &[ctx.bumps.vault]]],
            )?;
        }

        if ctx.accounts.focus_pool_vault.lamports() == 0 {
            let focus_pool_key = ctx.accounts.focus_pool_vault.key();
            let create_focus_pool_ix =
                anchor_lang::solana_program::system_instruction::create_account(
                    &ctx.accounts.authority.key(),
                    &focus_pool_key,
                    rent_lamports,
                    0,
                    ctx.program_id,
                );
            anchor_lang::solana_program::program::invoke_signed(
                &create_focus_pool_ix,
                &[
                    ctx.accounts.authority.to_account_info(),
                    ctx.accounts.focus_pool_vault.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
                &[&[
                    b"focus_pool_vault",
                    global_state.key().as_ref(),
                    &[ctx.bumps.focus_pool_vault],
                ]],
            )?;
        }

        if ctx.accounts.failure_pool_vault.lamports() == 0 {
            let failure_pool_key = ctx.accounts.failure_pool_vault.key();
            let create_failure_pool_ix =
                anchor_lang::solana_program::system_instruction::create_account(
                    &ctx.accounts.authority.key(),
                    &failure_pool_key,
                    rent_lamports,
                    0,
                    ctx.program_id,
                );
            anchor_lang::solana_program::program::invoke_signed(
                &create_failure_pool_ix,
                &[
                    ctx.accounts.authority.to_account_info(),
                    ctx.accounts.failure_pool_vault.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
                &[&[
                    b"failure_pool_vault",
                    global_state.key().as_ref(),
                    &[ctx.bumps.failure_pool_vault],
                ]],
            )?;
        }

        Ok(())
    }

    pub fn start_focus_session(
        ctx: Context<StartFocusSession>,
        stake_amount: u64,
        duration_minutes: u64,
    ) -> Result<()> {
        require!(stake_amount >= 10_000_000, ErrorCode::StakeTooLow);
        require!(
            duration_minutes > 0 && duration_minutes <= 480,
            ErrorCode::InvalidDuration
        );

        let user_state = &mut ctx.accounts.user_state;
        let global_state = &mut ctx.accounts.global_state;

        require!(!user_state.is_active, ErrorCode::SessionAlreadyActive);

        // calc amounts
        let focus_pool_amount = stake_amount / 100;
        let vault_amount = stake_amount
            .checked_sub(focus_pool_amount)
            .ok_or(ErrorCode::MathError)?;

        // transfer 1% to focus pool vault
        let to_focus_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.focus_pool_vault.to_account_info(),
            },
        );
        system_program::transfer(to_focus_ctx, focus_pool_amount)?;

        // transfer 99% to main escrow vault
        let to_vault_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        );
        system_program::transfer(to_vault_ctx, vault_amount)?;

        global_state.focus_pool += focus_pool_amount;
        global_state.total_sessions += 1;

        // update user state
        user_state.user = ctx.accounts.user.key();
        user_state.is_active = true;
        user_state.stake_amount = vault_amount;
        user_state.start_time = Clock::get()?.unix_timestamp;
        user_state.duration_minutes = duration_minutes;

        Ok(())
    }

    pub fn complete_focus_session(ctx: Context<CompleteFocusSession>) -> Result<()> {
        let user_state = &mut ctx.accounts.user_state;
        let _global_state = &ctx.accounts.global_state;

        require!(user_state.is_active, ErrorCode::NoActiveSession);

        let current_time = Clock::get()?.unix_timestamp;
        let elapsed_minutes = (current_time - user_state.start_time) / 60;

        // allow a small grace window for completion confirmation
        const GRACE_MINUTES: i64 = 5;
        let required_minutes = (user_state.duration_minutes as i64).saturating_sub(GRACE_MINUTES);
        require!(
            elapsed_minutes >= required_minutes,
            ErrorCode::SessionNotComplete
        );

        let return_amount = user_state.stake_amount;

        // transfer 99% back to user (program-owned vault -> arbitrary account)
        let from = ctx.accounts.vault.to_account_info();
        let to = ctx.accounts.user.to_account_info();
        **from.try_borrow_mut_lamports()? -= return_amount;
        **to.try_borrow_mut_lamports()? += return_amount;

        user_state.is_active = false;
        user_state.stake_amount = 0;

        Ok(())
    }

    pub fn fail_focus_session(ctx: Context<FailFocusSession>) -> Result<()> {
        let user_state = &mut ctx.accounts.user_state;
        let global_state = &mut ctx.accounts.global_state;

        require!(user_state.is_active, ErrorCode::NoActiveSession);

        // move 99% from vault to failure pool vault (direct lamport mutation)
        let amount = user_state.stake_amount;
        let from = ctx.accounts.vault.to_account_info();
        let to = ctx.accounts.failure_pool_vault.to_account_info();
        **from.try_borrow_mut_lamports()? -= amount;
        **to.try_borrow_mut_lamports()? += amount;

        global_state.failure_pool += amount;

        // reset user state
        user_state.is_active = false;
        user_state.stake_amount = 0;

        Ok(())
    }

    pub fn expire_focus_session(ctx: Context<ExpireFocusSession>) -> Result<()> {
        let user_state = &mut ctx.accounts.user_state;
        let global_state = &mut ctx.accounts.global_state;

        require!(user_state.is_active, ErrorCode::NoActiveSession);

        let current_time = Clock::get()?.unix_timestamp;
        let elapsed_minutes = (current_time - user_state.start_time) / 60;
        const GRACE_MINUTES: i64 = 5;
        let required_minutes = user_state.duration_minutes as i64 + GRACE_MINUTES;
        require!(
            elapsed_minutes >= required_minutes,
            ErrorCode::SessionNotComplete
        );

        // move funds to failure pool vault (direct lamport mutation)
        let amount = user_state.stake_amount;
        let from = ctx.accounts.vault.to_account_info();
        let to = ctx.accounts.failure_pool_vault.to_account_info();
        **from.try_borrow_mut_lamports()? -= amount;
        **to.try_borrow_mut_lamports()? += amount;

        global_state.failure_pool += amount;

        user_state.is_active = false;
        user_state.stake_amount = 0;

        Ok(())
    }

    pub fn withdraw_focus_pool(ctx: Context<WithdrawFocusPool>, amount: u64) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.global_state.authority,
            ctx.accounts.authority.key()
        );

        let gs = &ctx.accounts.global_state;
        let gs_key = gs.key();
        let seeds = &[b"focus_pool_vault", gs_key.as_ref(), &[gs.focus_pool_bump]];
        let _signer = &[&seeds[..]];

        // move from focus pool vault to recipient (direct lamport mutation)
        let from = ctx.accounts.focus_pool_vault.to_account_info();
        let to = ctx.accounts.recipient.to_account_info();
        **from.try_borrow_mut_lamports()? -= amount;
        **to.try_borrow_mut_lamports()? += amount;

        let global_state = &mut ctx.accounts.global_state;
        global_state.focus_pool = global_state.focus_pool.saturating_sub(amount);

        Ok(())
    }

    pub fn withdraw_failure_pool(ctx: Context<WithdrawFailurePool>, amount: u64) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.global_state.authority,
            ctx.accounts.authority.key()
        );

        let gs = &ctx.accounts.global_state;
        let gs_key = gs.key();
        let seeds = &[
            b"failure_pool_vault",
            gs_key.as_ref(),
            &[gs.failure_pool_bump],
        ];
        let _signer = &[&seeds[..]];

        // move from failure pool vault to recipient (direct lamport mutation)
        let from = ctx.accounts.failure_pool_vault.to_account_info();
        let to = ctx.accounts.recipient.to_account_info();
        **from.try_borrow_mut_lamports()? -= amount;
        **to.try_borrow_mut_lamports()? += amount;

        let global_state = &mut ctx.accounts.global_state;
        global_state.failure_pool = global_state.failure_pool.saturating_sub(amount);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + GlobalState::INIT_SPACE,
        seeds = [b"global_state"],
        bump
    )]
    pub global_state: Account<'info, GlobalState>,

    /// CHECK: Vault PDA to hold staked SOL
    #[account(
        mut,
        seeds = [b"vault", global_state.key().as_ref()],
        bump
    )]
    pub vault: UncheckedAccount<'info>,

    /// CHECK: Focus pool vault PDA (1% fees)
    #[account(
        mut,
        seeds = [b"focus_pool_vault", global_state.key().as_ref()],
        bump
    )]
    pub focus_pool_vault: UncheckedAccount<'info>,

    /// CHECK: Failure pool vault PDA (failed stakes)
    #[account(
        mut,
        seeds = [b"failure_pool_vault", global_state.key().as_ref()],
        bump
    )]
    pub failure_pool_vault: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StartFocusSession<'info> {
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserState::INIT_SPACE,
        seeds = [b"user_state", user.key().as_ref()],
        bump
    )]
    pub user_state: Account<'info, UserState>,

    #[account(
        mut,
        seeds = [b"global_state"],
        bump
    )]
    pub global_state: Account<'info, GlobalState>,

    /// CHECK: Vault PDA
    #[account(
        mut,
        seeds = [b"vault", global_state.key().as_ref()],
        bump = global_state.vault_bump
    )]
    pub vault: UncheckedAccount<'info>,

    /// CHECK: Focus pool vault PDA
    #[account(
        mut,
        seeds = [b"focus_pool_vault", global_state.key().as_ref()],
        bump = global_state.focus_pool_bump
    )]
    pub focus_pool_vault: UncheckedAccount<'info>,

    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CompleteFocusSession<'info> {
    #[account(
        mut,
        close = user,
        seeds = [b"user_state", user.key().as_ref()],
        bump,
        has_one = user
    )]
    pub user_state: Account<'info, UserState>,

    #[account(
        seeds = [b"global_state"],
        bump
    )]
    pub global_state: Account<'info, GlobalState>,

    /// CHECK: Vault PDA
    #[account(
        mut,
        seeds = [b"vault", global_state.key().as_ref()],
        bump = global_state.vault_bump
    )]
    pub vault: UncheckedAccount<'info>,

    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FailFocusSession<'info> {
    #[account(
        mut,
        close = user,
        seeds = [b"user_state", user.key().as_ref()],
        bump,
        has_one = user
    )]
    pub user_state: Account<'info, UserState>,

    #[account(
        mut,
        seeds = [b"global_state"],
        bump
    )]
    pub global_state: Account<'info, GlobalState>,

    /// CHECK: Vault PDA
    #[account(
        mut,
        seeds = [b"vault", global_state.key().as_ref()],
        bump = global_state.vault_bump
    )]
    pub vault: UncheckedAccount<'info>,

    /// CHECK: Failure pool vault PDA
    #[account(
        mut,
        seeds = [b"failure_pool_vault", global_state.key().as_ref()],
        bump = global_state.failure_pool_bump
    )]
    pub failure_pool_vault: UncheckedAccount<'info>,

    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExpireFocusSession<'info> {
    #[account(
        mut,
        close = receiver,
        seeds = [b"user_state", user.key().as_ref()],
        bump,
        has_one = user
    )]
    pub user_state: Account<'info, UserState>,

    #[account(
        mut,
        seeds = [b"global_state"],
        bump
    )]
    pub global_state: Account<'info, GlobalState>,

    /// CHECK: Vault PDA
    #[account(
        mut,
        seeds = [b"vault", global_state.key().as_ref()],
        bump = global_state.vault_bump
    )]
    pub vault: UncheckedAccount<'info>,

    /// CHECK: Failure pool vault PDA
    #[account(
        mut,
        seeds = [b"failure_pool_vault", global_state.key().as_ref()],
        bump = global_state.failure_pool_bump
    )]
    pub failure_pool_vault: UncheckedAccount<'info>,

    /// CHECK: Receiver of closed account rent (user)
    #[account(mut)]
    pub receiver: SystemAccount<'info>,

    /// CHECK: Associated user for PDA
    /// not required to sign for permissionless expiry
    /// only used as seed for user_state PDA
    pub user: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawFocusPool<'info> {
    #[account(
        mut,
        seeds = [b"global_state"],
        bump
    )]
    pub global_state: Account<'info, GlobalState>,

    /// CHECK: Focus pool vault
    #[account(
        mut,
        seeds = [b"focus_pool_vault", global_state.key().as_ref()],
        bump = global_state.focus_pool_bump
    )]
    pub focus_pool_vault: UncheckedAccount<'info>,

    #[account(mut)]
    pub recipient: SystemAccount<'info>,

    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawFailurePool<'info> {
    #[account(
        mut,
        seeds = [b"global_state"],
        bump
    )]
    pub global_state: Account<'info, GlobalState>,

    /// CHECK: Failure pool vault
    #[account(
        mut,
        seeds = [b"failure_pool_vault", global_state.key().as_ref()],
        bump = global_state.failure_pool_bump
    )]
    pub failure_pool_vault: UncheckedAccount<'info>,

    #[account(mut)]
    pub recipient: SystemAccount<'info>,

    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct GlobalState {
    pub authority: Pubkey,
    pub focus_pool: u64,
    pub failure_pool: u64,
    pub total_sessions: u64,
    pub vault_bump: u8,
    pub focus_pool_bump: u8,
    pub failure_pool_bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserState {
    pub user: Pubkey,
    pub is_active: bool,
    pub stake_amount: u64,
    pub start_time: i64,
    pub duration_minutes: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Stake amount too low. Minimum 0.01 SOL")]
    StakeTooLow,
    #[msg("Invalid duration. Must be between 1-480 minutes")]
    InvalidDuration,
    #[msg("User already has an active session")]
    SessionAlreadyActive,
    #[msg("No active session found")]
    NoActiveSession,
    #[msg("Session duration not yet complete")]
    SessionNotComplete,
    #[msg("Math error during calculation")]
    MathError,
}
