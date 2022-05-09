use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

declare_id!("5p3fWKASxACkTksYqPci3PAd2NKXmtwTRR1QyN7q6ogi");

#[derive(Clone, Copy, PartialEq)]
pub enum Stage {
    Initialized,
    FundsDeposited,
    EscrowComplete,
}

impl Stage {
    fn to_code(&self) -> u8 {
        match self {
            Stage::Initialized => 1,
            Stage::FundsDeposited => 2,
            Stage::EscrowComplete => 3,
        }
    }

    fn from(val: u8) -> std::result::Result<Stage, ProgramError> {
        match val {
            1 => Ok(Stage::Initialized),
            2 => Ok(Stage::FundsDeposited),
            3 => Ok(Stage::EscrowComplete),
            unknown_value => {
                msg!("Unknown stage: {}", unknown_value);
                Err(error!(ErrorCode::StageInvalid).into())
            }
        }
    }
}

#[account]
pub struct TransactionState {
    player: Pubkey,
    beneficiary: Pubkey,
    mint_of_token: Pubkey,
    escrow_account: Pubkey,
    amount_of_tokens: u64,
    stage: u8,
    state_bump: u8,
    escrow_bump: u8,
}

impl TransactionState {
    const LEN: usize = 32 + 32 + 32 + 32 + 8 + 1 + 1 + 1;
}

fn secure_transfer_cpi<'info>(
    amount: u64,
    sender_authority: AccountInfo<'info>,
    sender_token_account: AccountInfo<'info>,
    receiver_token_account: AccountInfo<'info>,
    token_program: AccountInfo<'info>,
    signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    let secure_transfer_instruction = anchor_spl::token::Transfer {
        from: sender_token_account,
        to: receiver_token_account,
        authority: sender_authority,
    };

    let secure_transfer_cpi_ctx =
        CpiContext::new_with_signer(token_program, secure_transfer_instruction, signer_seeds);

    anchor_spl::token::transfer(secure_transfer_cpi_ctx, amount)
}

#[program]
pub mod dungeon_nft {
    use super::*;

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

        state.stage = Stage::Initialized.to_code();

        Ok(())
    }

    pub fn deposit_by_both_parties(ctx: Context<DepositByBothParties>, amount: u64) -> Result<()> {
        if Stage::from(ctx.accounts.transaction_state.stage)? != Stage::Initialized {
            msg!(
                "Stage is invalid, state stage is {}",
                ctx.accounts.transaction_state.stage
            );
            return Err(ErrorCode::StageInvalid.into());
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
        secure_transfer_cpi(
            amount,
            ctx.accounts.player.to_account_info(),
            ctx.accounts
                .player_associated_token_account
                .to_account_info(),
            ctx.accounts.escrow_account.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            outer.as_ref()
        )?;

        //for the beneficiary
        secure_transfer_cpi(
            amount,
            ctx.accounts.beneficiary.to_account_info(),
            ctx.accounts
                .beneficiary_associated_token_account
                .to_account_info(),
            ctx.accounts.escrow_account.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            outer.as_ref()
        )?;

        ctx.accounts.transaction_state.amount_of_tokens = amount;

        msg!(
            "Both Parties funded the escrow account with {} tokens",
            amount
        );

        ctx.accounts.transaction_state.stage = Stage::FundsDeposited.to_code();

        Ok(())
    }

    pub fn transfer_to_winner(ctx: Context<TransferToWinner>, _winner: Pubkey) -> Result<()> {
        if Stage::from(ctx.accounts.transaction_state.stage)? != Stage::FundsDeposited {
            msg!(
                "Stage is invalid, state stage is {}",
                ctx.accounts.transaction_state.stage
            );
            return Err(ErrorCode::StageInvalid.into());
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

        secure_transfer_cpi(
            2 * ctx.accounts.transaction_state.amount_of_tokens,
            ctx.accounts.transaction_state.to_account_info(),
            ctx.accounts.escrow_account.to_account_info(),
            ctx.accounts
                .winner_associated_token_account
                .to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            outer.as_ref(),
        )?;

        ctx.accounts.escrow_account.reload()?;
        assert!(ctx.accounts.escrow_account.amount == 0);

        let close_escrow_account_instruction = anchor_spl::token::CloseAccount{
            account: ctx.accounts.escrow_account.to_account_info(),
            destination: ctx.accounts.player.to_account_info(),
            authority: ctx.accounts.transaction_state.to_account_info(),
        };


        let close_escrow_account_cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            close_escrow_account_instruction,
            outer.as_slice(),
        );
        anchor_spl::token::close_account(close_escrow_account_cpi_ctx)?;
    

        ctx.accounts.transaction_state.stage = Stage::EscrowComplete.to_code();
        Ok(())
    }


    pub fn pull_back(ctx: Context<PullBack>) -> Result<()> {
         if Stage::from(ctx.accounts.transaction_state.stage)? != Stage::FundsDeposited {
            msg!(
                "Stage is invalid, state stage is {}",
                ctx.accounts.transaction_state.stage
            );
            return Err(ErrorCode::StageInvalid.into());
        }

        assert!(ctx.accounts.escrow_account.amount == 2 * ctx.accounts.transaction_state.amount_of_tokens);

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


        secure_transfer_cpi(
            ctx.accounts.transaction_state.amount_of_tokens,
            ctx.accounts.transaction_state.to_account_info(),
            ctx.accounts.escrow_account.to_account_info(),
            ctx.accounts
                .player_associated_token_account
                .to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            outer.as_ref(),
        )?;

  
        secure_transfer_cpi(
            ctx.accounts.transaction_state.amount_of_tokens,
            ctx.accounts.transaction_state.to_account_info(),
            ctx.accounts.escrow_account.to_account_info(),
            ctx.accounts
                .beneficiary_associated_token_account
                .to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            outer.as_ref(),
        )?;

 
        let close_escrow_account_instruction = anchor_spl::token::CloseAccount{
            account: ctx.accounts.escrow_account.to_account_info(),
            destination: ctx.accounts.player.to_account_info(),
            authority: ctx.accounts.transaction_state.to_account_info(),
        };


        let close_escrow_account_cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            close_escrow_account_instruction,
            outer.as_slice(),
        );
        anchor_spl::token::close_account(close_escrow_account_cpi_ctx)?;
    
        Ok(())
    }
}

#[derive(Accounts)]
pub struct TransactionSetup<'info> {
    #[account(
        init,
        space = 8 + TransactionState::LEN,
        payer = player,
        seeds = [
            b"transaction-state".as_ref(),
            player.key().as_ref(),
            beneficiary.key().as_ref(),
            mint_of_token.key().as_ref(),
        ],
        bump
    )]
    transaction_state: Account<'info, TransactionState>,

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
    transaction_state: Account<'info, TransactionState>,

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
    transaction_state: Account<'info, TransactionState>,

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

#[derive(Accounts)]
pub struct PullBack<'info> {
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
    transaction_state: Account<'info, TransactionState>,

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

    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    player: AccountInfo<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    beneficiary: AccountInfo<'info>,

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

#[error_code]
pub enum ErrorCode {
    #[msg("Stage is invalid")]
    StageInvalid,
}
