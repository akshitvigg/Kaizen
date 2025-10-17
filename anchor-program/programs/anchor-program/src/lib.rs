use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("CETiLPyUefJ5FT7TkARKM7W2NhGxDHmze8CiSqptNFFZ");

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
        Ok(())
    }

    pub fn start_focus_session(
        ctx: Context<StartFocusSession>,
        stake_amount: u64,
        duration_minutes: u64,
    ) -> Result<()> {
        require!(stake_amount >= 10_000_000, ErrorCode::StakeTooLow); // min 0.01 SOL
        require!(
            duration_minutes > 0 && duration_minutes <= 480,
            ErrorCode::InvalidDuration
        ); // Max 8 hours

        let user_state = &mut ctx.accounts.user_state;
        let global_state = &mut ctx.accounts.global_state;

        require!(!user_state.is_active, ErrorCode::SessionAlreadyActive);

        // calc amounts
        let focus_pool_amount = stake_amount / 100;
        let vault_amount = stake_amount - focus_pool_amount;

        // transfer stake amount from user to vault
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        );
        system_program::transfer(cpi_context, stake_amount)?;

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
        let global_state = &ctx.accounts.global_state;

        require!(user_state.is_active, ErrorCode::NoActiveSession);

        let current_time = Clock::get()?.unix_timestamp;
        let elapsed_minutes = (current_time - user_state.start_time) / 60;

        require!(
            elapsed_minutes >= user_state.duration_minutes as i64,
            ErrorCode::SessionNotComplete
        );

        let return_amount = user_state.stake_amount;

        // transfer 99% back to user
        let global_key = global_state.key();
        let seeds = &[b"vault", global_key.as_ref(), &[global_state.vault_bump]];
        let signer = &[&seeds[..]];

        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.user.to_account_info(),
            },
            signer,
        );
        system_program::transfer(cpi_context, return_amount)?;

        user_state.is_active = false;
        user_state.stake_amount = 0;

        Ok(())
    }

    pub fn fail_focus_session(ctx: Context<FailFocusSession>) -> Result<()> {
        let user_state = &mut ctx.accounts.user_state;
        let global_state = &mut ctx.accounts.global_state;

        require!(user_state.is_active, ErrorCode::NoActiveSession);

        // add 99% to failure pool (it stays in vault, just tracked)
        global_state.failure_pool += user_state.stake_amount;

        // reset user state
        user_state.is_active = false;
        user_state.stake_amount = 0;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
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
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StartFocusSession<'info> {
    #[account(
        init,
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
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CompleteFocusSession<'info> {
    #[account(
        mut,
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
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FailFocusSession<'info> {
    #[account(
        mut,
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

    pub user: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct GlobalState {
    pub authority: Pubkey,
    pub focus_pool: u64,
    pub failure_pool: u64,
    pub total_sessions: u64,
    pub vault_bump: u8,
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
}
