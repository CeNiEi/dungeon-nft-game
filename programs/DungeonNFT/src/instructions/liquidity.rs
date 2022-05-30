use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

use crate::{error, state, utils};

pub fn add_liquidity(
    ctx: Context<LiquidityOperation>,
    token_amount: u64,
    sol_amount: u64,
) -> Result<()> {
    let token_balance = ctx.accounts.beneficiary_token_ata.amount;
    let sol_balance = ctx.accounts.beneficiary_sol_ata.amount;

    let curr_token_in_vault = ctx.accounts.token_vault.amount;
    let curr_sol_in_vault = ctx.accounts.sol_vault.amount;

    let initial_liquidity_addition = curr_sol_in_vault == 0 && curr_token_in_vault == 0;

    let token_deposit_amount = token_amount;
    let sol_deposit_amount;

    if initial_liquidity_addition {
        sol_deposit_amount = sol_amount;
    } else {
        let exchange_rate = curr_sol_in_vault.checked_div(curr_token_in_vault).unwrap();
        sol_deposit_amount = token_deposit_amount.checked_mul(exchange_rate).unwrap();
    }

    require!(
        sol_deposit_amount <= sol_balance,
        error::ErrorCode::NotEnoughBalance
    );
    require!(
        token_deposit_amount <= token_balance,
        error::ErrorCode::NotEnoughBalance
    );

    let state_bump_bytes = ctx.accounts.market_state.state_bump.to_le_bytes();
    let inner = vec![
        b"market-state".as_ref(),
        ctx.accounts.beneficiary.key.as_ref(),
        state_bump_bytes.as_ref()
    ];
    let outer = vec![inner.as_slice()];

    utils::secure_transfer_cpi(
        token_deposit_amount,
        ctx.accounts.beneficiary.to_account_info(),
        ctx.accounts.beneficiary_token_ata.to_account_info(),
        ctx.accounts.token_vault.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        outer.as_ref(),
    )?;

    utils::secure_transfer_cpi(
        sol_deposit_amount,
        ctx.accounts.beneficiary.to_account_info(),
        ctx.accounts.beneficiary_sol_ata.to_account_info(),
        ctx.accounts.sol_vault.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        outer.as_ref(),
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct LiquidityOperation<'info> {
    #[account(mut, 
        seeds = [
            b"market-state".as_ref(), 
            beneficiary.key().as_ref()
        ],
        bump = market_state.state_bump
    )]
    pub market_state: Account<'info, state::MarketState>,

    #[account(mut, 
        seeds = [
            b"token-vault".as_ref(), 
            market_state.key().as_ref(),
            beneficiary.key().as_ref()
        ], 
        bump = market_state.token_vault_bump,
        )]
    pub token_vault: Account<'info, TokenAccount>,

    #[account(mut, 
        seeds = [
            b"sol-vault".as_ref(), 
            market_state.key().as_ref(),
            beneficiary.key().as_ref()
        ],
        bump = market_state.sol_vault_bump,
        )]
    pub sol_vault: Account<'info, TokenAccount>,

    #[account(mut, token::authority = beneficiary)]
    pub beneficiary_token_ata: Account<'info, TokenAccount>,

    #[account(mut, token::authority = beneficiary)]
    pub beneficiary_sol_ata: Account<'info, TokenAccount>,

    pub beneficiary: Signer<'info>,

    pub token_program: Program<'info, Token>,
}
