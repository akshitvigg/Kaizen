use anchor_lang::prelude::*;

declare_id!("CETiLPyUefJ5FT7TkARKM7W2NhGxDHmze8CiSqptNFFZ");

#[program]
pub mod anchor_program {

    use anchor_lang::prelude::program::invoke_signed;

    use super::*;

    pub fn create_session(
        ctx: Context<CreateSession>,
        duration: i64,
        stake_amount: u64,
    ) -> Result<()> {
        let session = &mut ctx.accounts.session;
        session.user = *ctx.accounts.user.key;
        session.stake_amount = stake_amount;
        session.start_time = Clock::get()?.unix_timestamp;
        session.duration = duration;
        session.status = 0;

        let session_key = session.key();
        let vault_seeds = &[b"vault", session_key.as_ref(), &[ctx.accounts.vault.bump]];

        invoke_signed(
            &system_instruction::transfer(
                &ctx.accounts.user.key(),
                &ctx.accounts.vault.key(),
                stake_amount,
            ),
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[vault_seeds],
        )?;

        ctx.accounts.vault.bump = ctx.bumps.vault;

        msg!("session created for {:?} ", ctx.accounts.user.key());
        Ok(())
    }

    pub fn complete_session(ctx: Context<CompleteSession>) -> Result<()> {
        let session = &mut ctx.accounts.session;
        let now = Clock::get()?.unix_timestamp;

        require!(
            now >= session.start_time + session.duration,
            ErrorCode::TooEarly
        );

        let user_share = session.stake_amount * 99 / 100;
        let pool_share = session.stake_amount - user_share;

        let session_key = session.key();
        let vault_seeds = &[b"vault", session_key.as_ref(), &[ctx.accounts.vault.bump]];

        invoke_signed(
            &system_instruction::transfer(
                &ctx.accounts.vault.key(),
                &ctx.accounts.user.key(),
                user_share,
            ),
            &[
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.user.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[vault_seeds],
        )?;

        invoke_signed(
            &system_instruction::transfer(
                &ctx.accounts.vault.key(),
                &ctx.accounts.focus_pool.key(),
                pool_share,
            ),
            &[
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.focus_pool.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[vault_seeds],
        )?;

        session.status = 1;
        msg!("Session completed for {:?}", ctx.accounts.user.key());
        Ok(())
    }

    pub fn expire_session(ctx: Context<ExpireSession>) -> Result<()> {
        let session = &mut ctx.accounts.session;
        let now = Clock::get()?.unix_timestamp;

        require!(
            now > session.start_time + session.duration,
            ErrorCode::NotExpired
        );

        let session_key = session.key();
        let vault_seeds = &[b"vault", session_key.as_ref(), &[ctx.accounts.vault.bump]];

        invoke_signed(
            &system_instruction::transfer(
                &ctx.accounts.vault.key(),
                &ctx.accounts.failure_pool.key(),
                session.stake_amount,
            ),
            &[
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.failure_pool.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[vault_seeds],
        )?;

        session.status = 2;
        msg!("Session expired for {:?}", session.user);
        Ok(())
    }
}

#[account]
pub struct Session {
    pub user: Pubkey,
    pub stake_amount: u64,
    pub start_time: i64,
    pub duration: i64,
    pub status: u8, // 0 = pending, 1 = completed , 2= failed
}

#[account]
pub struct VaultAccount {
    pub bump: u8,
}

#[derive(Accounts)]
pub struct CreateSession<'info> {
    #[account(init, payer=user, space=8+32+8+8+8+1)]
    pub session: Account<'info, Session>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        seeds = [b"vault", session.key().as_ref()],
        bump,
        space = 8 + 1
    )]
    pub vault: Account<'info, VaultAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CompleteSession<'info> {
    #[account(mut, has_one=user)]
    pub session: Account<'info, Session>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(seeds = [b"vault", session.key().as_ref()],bump=vault.bump)]
    pub vault: Account<'info, VaultAccount>,

    ///CHECK: This is the focus_pool account that receives 1% of completed session stakes
    #[account(mut)]
    pub focus_pool: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExpireSession<'info> {
    #[account(mut)]
    pub session: Account<'info, Session>,

    #[account(seeds = [b"vault", session.key().as_ref()],bump= vault.bump)]
    pub vault: Account<'info, VaultAccount>,

    ///CHECK: This is the failure_pool account that receives stakes from failed sessions
    #[account(mut)]
    pub failure_pool: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Too early to complete the session")]
    TooEarly,

    #[msg("Session has not expired yet")]
    NotExpired,
}
