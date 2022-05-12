use anchor_lang::prelude::*;

pub mod instructions;
pub use instructions::*;

pub mod utils;
pub mod error;
pub mod state;

declare_id!("5p3fWKASxACkTksYqPci3PAd2NKXmtwTRR1QyN7q6ogi");

#[program]
pub mod dungeon_nft {
    use super::*;

    pub fn transaction_setup_instruction(ctx: Context<TransactionSetup>) -> Result<()> {
        transaction_setup::transaction_setup(ctx)
    }

    pub fn deposit_by_both_parties_instruction(ctx: Context<DepositByBothParties>, amount: u64) -> Result<()> {
        deposit_by_both_parties::deposit_by_both_parties(ctx, amount)
    }

    pub fn transfer_to_winner_instruction(ctx: Context<TransferToWinner>, winner: Pubkey) -> Result<()> {
        transfer_to_winner::transfer_to_winner(ctx, winner)
    } 

    pub fn pullback_instruction(ctx: Context<PullBack>) -> Result<()> {
        pullback::pull_back(ctx)
    }

}
