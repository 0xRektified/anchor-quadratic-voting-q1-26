use anchor_lang::prelude::*;

use crate::state::{Dao, Proposal};

#[derive(Accounts)]
pub struct InitProposalContext<'info>{

    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(mut)]
    pub dao_account: Account<'info, Dao>,

    #[account(
        init,
        payer = creator,
        space= 8 + Proposal::INIT_SPACE,
        seeds = [
            b"proposal",
            dao_account.key().as_ref(),
            dao_account.proposal_count.to_le_bytes().as_ref()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,

    pub system_program: Program<'info, System>,
}

impl<'info> InitProposalContext<'info> {
    pub fn init(&mut self, bumps: &InitProposalContextBumps, metadata: String) -> Result<()> {
        self.dao_account.proposal_count += 1;
        self.proposal.set_inner(
            Proposal {
                authority: self.creator.key(),
                metadata,
                yes_vote_count: 0,
                no_vote_count: 0,
                bump: bumps.proposal,
            }
        );
        Ok(())
    }
}