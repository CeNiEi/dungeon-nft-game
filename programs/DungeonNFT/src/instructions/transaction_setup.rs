use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::{state, utils};

pub fn transaction_setup(ctx: Context<TransactionSetup>) -> Result<()> {
    let state = &mut ctx.accounts.transaction_state;

    state.player = ctx.accounts.player.key().clone();
    state.beneficiary = ctx.accounts.beneficiary.key().clone();

    state.mint_of_token = ctx.accounts.mint_of_token.key().clone();
    state.escrow_account = ctx.accounts.escrow_account.key().clone();

    state.amount_of_tokens = 0;

    state.state_bump = *ctx.bumps.get("transaction_state").unwrap();
    state.escrow_bump = *ctx.bumps.get("escrow_account").unwrap();

    msg!("Initialized new Safe Transfer instance");

    state.stage = utils::Stage::Initialized.to_code();

    Ok(())
}

#[derive(Accounts)]
pub struct TransactionSetup<'info> {
    #[account(
        init,
        space = 8 + state::TransactionState::LEN,
        payer = player,
        seeds = [
            b"transaction-state".as_ref(),
            player.key().as_ref(),
            beneficiary.key().as_ref(),
            mint_of_token.key().as_ref(),
        ],
        bump
    )]
    transaction_state: Account<'info, state::TransactionState>,

    #[account(
        init,
        payer = player,
        seeds = [
            b"escrow-account".as_ref(),
            player.key().as_ref(),
            beneficiary.key().as_ref(),
            mint_of_token.key().as_ref(),
        ],
        bump,
        token::mint = mint_of_token,
        token::authority = transaction_state
    )]
    escrow_account: Account<'info, TokenAccount>,

    #[account(mut)]
    player: Signer<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    beneficiary: AccountInfo<'info>,

    mint_of_token: Account<'info, Mint>,

    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,

    rent: Sysvar<'info, Rent>,
}
