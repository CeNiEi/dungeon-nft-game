use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::state;

pub fn amm_setup(ctx: Context<AMMSetup>, fee_numerator: u64, fee_denominator: u64) -> Result<()> {
    let market_state = &mut ctx.accounts.market_state;
    market_state.fee_numerator = fee_numerator;
    market_state.fee_denominator = fee_denominator;

    market_state.state_bump = *ctx.bumps.get("market_state").unwrap();
    market_state.token_vault_bump = *ctx.bumps.get("token_vault").unwrap();
    market_state.sol_vault_bump = *ctx.bumps.get("sol_vault").unwrap();

    Ok(())
}

#[derive(Accounts)]
pub struct AMMSetup<'info> {
    pub token_mint: Account<'info, Mint>,

    // can be changed to any other token in future
    // but for now, we have SOL
    pub sol_mint: Account<'info, Mint>,

    #[account(
        init, 
        space = 8 + state::MarketState::LEN,
        payer = beneficiary, 
        seeds = [
            b"market-state".as_ref(), 
            beneficiary.key().as_ref()
        ], 
        bump, 
    )]
    pub market_state: Account<'info, state::MarketState>,

    #[account(
        init, 
        payer = beneficiary, 
        seeds = [
            b"token-vault".as_ref(), 
            market_state.key().as_ref(),
            beneficiary.key().as_ref()
        ], 
        bump,
        token::mint = token_mint,
        token::authority = market_state
    )]
    pub token_vault: Account<'info, TokenAccount>,

    #[account(
        init, 
        payer = beneficiary, 
        seeds = [
            b"sol-vault".as_ref(), 
            market_state.key().as_ref(),
            beneficiary.key().as_ref()
        ],
        bump, 
        token::mint = sol_mint, 
        token::authority = market_state
    )]
    pub sol_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub beneficiary: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
