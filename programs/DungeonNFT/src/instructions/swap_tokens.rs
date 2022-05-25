use anchor_lang::prelude::*;
use anchor_spl::token::{TokenAccount, Token};

use crate::{error, state, utils};

pub fn swap_tokens(ctx: Context<SwapTokens>, amount_in: u64) -> Result<()> {
    let source_ata_balance = ctx.accounts.player_source_ata.amount;

    require!(
        amount_in <= source_ata_balance,
        error::ErrorCode::NotEnoughBalance
    );

    let source_vault_balance = ctx.accounts.source_vault.amount as u128;
    let destination_vault_balance = ctx.accounts.destination_vault.amount as u128;

    let market_state = &ctx.accounts.market_state;
    let fee_amount = (amount_in as u128)
        .checked_mul(market_state.fee_numerator as u128)
        .unwrap()
        .checked_div(market_state.fee_denominator as u128)
        .unwrap();
    let amount_in_minus_fee = amount_in as u128 - fee_amount;

    let constant_product = source_vault_balance
        .checked_mul(destination_vault_balance)
        .unwrap();

    utils::secure_transfer_cpi(amount_in, ctx.accounts.beneficiary.to_account_info(), ctx.accounts.player_source_ata.to_account_info(), ctx.accounts.source_vault.to_account_info(), ctx.accounts.token_program.to_account_info(), None)?;

    Ok(())
}

#[derive(Accounts)]
pub struct SwapTokens<'info> {
    #[account(mut)]
    pub market_state: Account<'info, state::MarketState>,

    #[account(mut, 
        token::mint = player_source_ata.mint,
        token::authority = beneficiary
    )]
    pub source_vault: Account<'info, TokenAccount>,

    #[account(mut, 
        token::mint = player_source_ata.mint,
        token::authority = beneficiary
    )]
    pub destination_vault: Account<'info, TokenAccount>,

    #[account(mut, 
        token::authority = beneficiary
    )]
    pub player_source_ata: Account<'info, TokenAccount>,

    #[account(mut, 
        token::authority = beneficiary
    )]
    pub player_destination_ata: Account<'info, TokenAccount>,

    pub beneficiary: Signer<'info>,

    pub token_program: Program<'info, Token>
}
