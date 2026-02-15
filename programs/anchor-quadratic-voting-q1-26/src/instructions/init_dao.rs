use anchor_lang::prelude::*;

use crate::state::Dao;

#[derive(Accounts)]
#[instruction(name: String)]
pub struct InitDao<'info>{

    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space = 8 + Dao::INIT_SPACE,
        seeds = [b"dao", creator.key().as_ref(), name.as_bytes()],
        bump
    )]
    pub dao_account: Account<'info, Dao>,

    pub system_program: Program<'info, System>,
}

impl<'info> InitDao<'info> {
    pub fn init(&mut self, bumps: &InitDaoBumps, name: String) -> Result<()> {
        self.dao_account.set_inner(
            Dao {
                name,
                authority: self.creator.key(),
                proposal_count: 0,
                bump: bumps.dao_account
            }
        );
        Ok(())
    }
}