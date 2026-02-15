use anchor_lang::prelude::*;

mod state;
mod instructions;
mod errors;

use instructions::*;

declare_id!("AnBkWTCj5fySwjX1X762GVwxQHappyvVXX8aMwRZ1dZk");

#[program]
pub mod anchor_quadratic_voting_q1_26 {
    use super::*;

    pub fn init_dao(ctx: Context<InitDao>, name: String) -> Result<()> {
        ctx.accounts.init(&ctx.bumps, name)
    }

    pub fn init_proposal(ctx: Context<InitProposalContext>, metadata: String) -> Result<()> {
        ctx.accounts.init(&ctx.bumps, metadata)
    }

    pub fn cast_vote(ctx: Context<CastVote>, vote_type: u8) -> Result<()> {
        ctx.accounts.cast(&ctx.bumps, vote_type)
    }
}
