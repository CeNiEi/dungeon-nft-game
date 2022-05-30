use anchor_lang::prelude::*;
use anchor_spl::token::{TokenAccount, Token};

use crate::{error, state, utils};

// sol_to_token = true ==> player is giving sol to get tokens
pub fn swap_tokens(ctx: Context<SwapTokens>, amount_in: u64, sol_to_token: bool) -> Result<()> {

    // player_source_ata sends the token to be swapped to the destination_vault
    // the required token is sent from source_vault to player_dest_ata
    let player_source_ata;
    let player_dest_ata;
    
    let source_vault;
    let destination_vault;

    if sol_to_token {
        player_source_ata = &ctx.accounts.player_sol_ata;
        player_dest_ata = &ctx.accounts.player_token_ata;
        
        source_vault = &ctx.accounts.token_vault;
        destination_vault = &ctx.accounts.sol_vault;
    } else {
        player_source_ata = &ctx.accounts.player_token_ata;
        player_dest_ata = &ctx.accounts.player_sol_ata;

        source_vault = &ctx.accounts.sol_vault;
        destination_vault = &ctx.accounts.token_vault;
    }

    let source_ata_balance = player_source_ata.amount;

    require!(
        amount_in <= source_ata_balance,
        error::ErrorCode::NotEnoughBalance
    );

    let source_vault_balance = source_vault.amount as u128;
    let destination_vault_balance = destination_vault.amount as u128;

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

    let post_transaction_dest_vault_balance = destination_vault_balance + amount_in_minus_fee;
    let post_transaction_source_vault_balance = constant_product.checked_div(post_transaction_dest_vault_balance).unwrap();
    let amount_out = source_vault_balance.checked_sub(post_transaction_source_vault_balance).unwrap();

    
    let state_bump_bytes = market_state.state_bump.to_le_bytes();
    let inner = vec![
        b"market-state".as_ref(),
        ctx.accounts.beneficiary.key.as_ref(),
        state_bump_bytes.as_ref()
    ];
    let outer = vec![inner.as_slice()];


    utils::secure_transfer_cpi(amount_in, ctx.accounts.player.to_account_info(), player_source_ata.to_account_info(), destination_vault.to_account_info(), ctx.accounts.token_program.to_account_info(), outer.as_ref())?;

    utils::secure_transfer_cpi(amount_out as u64, market_state.to_account_info(), source_vault.to_account_info(), player_dest_ata.to_account_info(), ctx.accounts.token_program.to_account_info(), outer.as_ref())?;

    Ok(())
}

#[derive(Accounts)]
pub struct SwapTokens<'info> {
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

    #[account(mut, token::authority = player)]
    pub player_token_ata: Account<'info, TokenAccount>,

    #[account(mut, token::authority = player)]
    pub player_sol_ata: Account<'info, TokenAccount>,

    pub player: Signer<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    beneficiary: AccountInfo<'info>,

    pub token_program: Program<'info, Token>
}
