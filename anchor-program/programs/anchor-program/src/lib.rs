use anchor_lang::prelude::*;

declare_id!("7i6pU54rKPsfuvdzmEVe9W8fpLA1vtZUbmZfbXamrrxn");

#[program]
pub mod anchor_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
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

#[derive(Accounts)]
pub struct CreateSession<'info> {
    #[account(init, payer=user, space = 8+32+8+8+8+1)]
    pub session: Account<'info, Session>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub vault: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}
