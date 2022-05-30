use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::{error, state, utils};

pub fn transfer_to_winner(ctx: Context<TransferToWinner>, _winner: Pubkey) -> Result<()> {
    if utils::Stage::from(ctx.accounts.transaction_state.stage)? != utils::Stage::FundsDeposited {
        msg!(
            "Stage is invalid, state stage is {}",
            ctx.accounts.transaction_state.stage
        );
        return Err(error::ErrorCode::StageInvalid.into());
    }

    let mint_of_token_public_key = ctx.accounts.mint_of_token.key().clone();
    let state_bump_bytes = ctx.accounts.transaction_state.state_bump.to_le_bytes();
    let inner = vec![
        b"transaction-state".as_ref(),
        ctx.accounts.player.key.as_ref(),
        ctx.accounts.beneficiary.key.as_ref(),
        mint_of_token_public_key.as_ref(),
        state_bump_bytes.as_ref(),
    ];
    let outer = vec![inner.as_slice()];

    utils::secure_transfer_cpi(
        2 * ctx.accounts.transaction_state.amount_of_tokens,
        ctx.accounts.transaction_state.to_account_info(),
        ctx.accounts.escrow_account.to_account_info(),
        ctx.accounts
            .winner_associated_token_account
            .to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        outer.as_ref(),
    )?;

    utils::close_account_cpi(
        ctx.accounts.escrow_account.to_account_info(),
        ctx.accounts.player.to_account_info(),
        ctx.accounts.transaction_state.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        outer.as_ref(),
    )?;

    ctx.accounts.transaction_state.stage = utils::Stage::EscrowComplete.to_code();
    Ok(())
}

#[derive(Accounts)]
#[instruction(winner: Pubkey)]
pub struct TransferToWinner<'info> {
    #[account(
        mut,
        seeds = [
            b"transaction-state".as_ref(),
            player.key().as_ref(),
            beneficiary.key().as_ref(),
            mint_of_token.key().as_ref()
        ],
        bump = transaction_state.state_bump, 
        close = player
    )]
    transaction_state: Account<'info, state::TransactionState>,

    #[account(
        mut,
        seeds = [
            b"escrow-account".as_ref(),
            player.key().as_ref(),
            beneficiary.key().as_ref(),
            mint_of_token.key().as_ref()
        ],
        bump = transaction_state.escrow_bump, 
    )]
    escrow_account: Account<'info, TokenAccount>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    player: AccountInfo<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    beneficiary: AccountInfo<'info>,

    mint_of_token: Account<'info, Mint>,

    #[account(
        mut,
        constraint = winner_associated_token_account.owner == winner,
        constraint = winner_associated_token_account.mint == mint_of_token.key()
    )]
    winner_associated_token_account: Account<'info, TokenAccount>,

    token_program: Program<'info, Token>,
}
