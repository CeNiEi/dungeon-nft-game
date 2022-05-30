use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::{error, state, utils};

pub fn deposit_by_both_parties(ctx: Context<DepositByBothParties>, amount: u64) -> Result<()> {
    // add checkcs to ensure enough balance

    if utils::Stage::from(ctx.accounts.transaction_state.stage)? != utils::Stage::Initialized {
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

    //for the player
    utils::secure_transfer_cpi(
        amount,
        ctx.accounts.player.to_account_info(),
        ctx.accounts
            .player_associated_token_account
            .to_account_info(),
        ctx.accounts.escrow_account.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        outer.as_ref(),
    )?;

    //for the beneficiary
    utils::secure_transfer_cpi(
        amount,
        ctx.accounts.beneficiary.to_account_info(),
        ctx.accounts
            .beneficiary_associated_token_account
            .to_account_info(),
        ctx.accounts.escrow_account.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        outer.as_ref(),
    )?;

    ctx.accounts.transaction_state.amount_of_tokens = amount;

    msg!(
        "Both Parties funded the escrow account with {} tokens",
        amount
    );

    ctx.accounts.transaction_state.stage = utils::Stage::FundsDeposited.to_code();

    Ok(())
}

#[derive(Accounts)]
pub struct DepositByBothParties<'info> {
    #[account(
        mut,
        seeds = [
            b"transaction-state".as_ref(),
            player.key().as_ref(),
            beneficiary.key().as_ref(),
            mint_of_token.key().as_ref()
        ],
        bump = transaction_state.state_bump
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
        bump = transaction_state.escrow_bump
    )]
    escrow_account: Account<'info, TokenAccount>,

    player: Signer<'info>,
    beneficiary: Signer<'info>,

    mint_of_token: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint_of_token,
        associated_token::authority = player
    )]
    player_associated_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::authority = beneficiary,
        associated_token::mint = mint_of_token
    )]
    beneficiary_associated_token_account: Account<'info, TokenAccount>,

    token_program: Program<'info, Token>,
}
