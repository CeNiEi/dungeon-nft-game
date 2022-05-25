use anchor_lang::prelude::*;

pub mod instructions;
pub use instructions::*;

pub mod error;
pub mod state;
pub mod utils;

declare_id!("5p3fWKASxACkTksYqPci3PAd2NKXmtwTRR1QyN7q6ogi");

#[program]
pub mod dungeon_nft {
    use super::*;

    pub fn transaction_setup_instruction(ctx: Context<TransactionSetup>) -> Result<()> {
        transaction_setup::transaction_setup(ctx)
    }

    pub fn deposit_by_both_parties_instruction(
        ctx: Context<DepositByBothParties>,
        amount: u64,
    ) -> Result<()> {
        deposit_by_both_parties::deposit_by_both_parties(ctx, amount)
    }

    pub fn transfer_to_winner_instruction(
        ctx: Context<TransferToWinner>,
        winner: Pubkey,
    ) -> Result<()> {
        transfer_to_winner::transfer_to_winner(ctx, winner)
    }

    pub fn pullback_instruction(ctx: Context<PullBack>) -> Result<()> {
        pullback::pull_back(ctx)
    }

    pub fn amm_setup_instruction(
        ctx: Context<AMMSetup>,
        fee_numerator: u64,
        fee_denominator: u64,
    ) -> Result<()> {
        amm_setup::amm_setup(ctx, fee_numerator, fee_denominator)
    }

    pub fn add_liquidity_instruction(
        ctx: Context<LiquidityOperation>, 
        token_amount: u64, 
        sol_amount: u64
    ) -> Result<()> {
        liquidity::add_liquidity(ctx, token_amount, sol_amount)
    }
}
