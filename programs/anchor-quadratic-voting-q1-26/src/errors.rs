use anchor_lang::prelude::*;

#[error_code]
pub enum VotingError {
    #[msg("The token account does not belong to the voter")]
    InvalidTokenAccount,
    #[msg("Invalid vote type. Must be 0 or 1")]
    InvalidVoteType,
    #[msg("Proposal does not belong to this DAO")]
    InvalidProposal,
}
