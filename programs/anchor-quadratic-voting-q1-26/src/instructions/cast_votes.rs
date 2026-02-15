use anchor_lang::prelude::*;
use anchor_spl::{
    token::{Token, TokenAccount},
};
use crate::state::{Dao, Proposal, Vote};
use crate::errors::VotingError;

#[derive(Accounts)]
pub struct CastVote<'info>{

    #[account(mut)]
    pub voter: Signer<'info>,

    #[account(mut)]
    pub dao_account: Account<'info, Dao>,

    #[account(
        mut,
        constraint = proposal.authority == dao_account.authority @ VotingError::InvalidProposal
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(
        init,
        payer = voter,
        space= 8 + Vote::INIT_SPACE,
        seeds = [
            b"vote",
            voter.key().as_ref(),
            proposal.key().as_ref()
        ],
        bump
    )]
    pub vote_account: Account<'info, Vote>,

    #[account(
        constraint = voter_token_account.owner == voter.key() @ VotingError::InvalidTokenAccount
    )]
    pub voter_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> CastVote<'info> {
    pub fn cast(&mut self, bumps: &CastVoteBumps, vote_type: u8) -> Result<()> {
        require!(vote_type == 0 || vote_type == 1, VotingError::InvalidVoteType);

        let voting_credits = (self.voter_token_account.amount as f64).sqrt() as u64;

        self.vote_account.set_inner(
            Vote {
                authority: self.voter.key(),
                vote_type,
                vote_credits: voting_credits,
                bump: bumps.vote_account
            }
        );

        if vote_type == 1 {
            self.proposal.yes_vote_count += voting_credits;
        } else {
            self.proposal.no_vote_count += voting_credits;
        }

        Ok(())
    }
}