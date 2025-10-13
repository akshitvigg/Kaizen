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

#[derive(Accounts)]
pub struct Initialize {}
