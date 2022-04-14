use anchor_lang::prelude::*;
use anchor_spl::token::{TokenAccount, Mint, Token};

declare_id!("5p3fWKASxACkTksYqPci3PAd2NKXmtwTRR1QyN7q6ogi");

#[program]
pub mod dungeon_nft {
    use anchor_spl::token::Transfer;

    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn initialize_new_grant(ctx: Context<InitializeNewGrant>, application_idx: u64, amount: u64) -> Result<()> {
        let state = &mut ctx.accounts.application_state;

        state.idx = application_idx;
        state.sender = ctx.accounts.sender.key().clone();
        state.reciever = ctx.accounts.reciever.key().clone();
        state.mint_of_token_being_sent = ctx.accounts.mint_of_token_being_sent.key().clone();
        state.escrow_wallet = ctx.accounts.escrow_wallet_state.key().clone();
        state.amount_of_tokens = amount;

        let state_bump = *ctx.bumps.get("application_state").unwrap();
        state.bump = state_bump;

        msg!("Initialized new Safe Transfer instance for {}", amount);

        let bump_vector = state_bump.to_le_bytes();
        let mint_of_token_being_sent_pk = ctx.accounts.mint_of_token_being_sent.key().clone();
        let application_idx_bytes = application_idx.to_le_bytes();

        let inner = vec![
            b"application-state".as_ref(), 
            ctx.accounts.sender.key.as_ref(),
            ctx.accounts.reciever.key.as_ref(), 
            mint_of_token_being_sent_pk.as_ref(), 
            application_idx_bytes.as_ref(), 
            bump_vector.as_ref()
        ];
        let outer = vec![inner.as_slice()];

        let transfer_instruction = Transfer {
            from: ctx.accounts.wallet_to_withdraw_from.to_account_info(),
            to: ctx.accounts.escrow_wallet_state.to_account_info(), 
            authority: ctx.accounts.sender.to_account_info()
        };

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction, 
            outer.as_slice()
        );

        anchor_spl::token::transfer(cpi_ctx, state.amount_of_tokens)?;

        state.stage = Stage::FundsDeposited.to_code();

        Ok(())
    }


}

#[derive(Clone, Copy, PartialEq)]
pub enum Stage {
    FundsDeposited,
    EscrowComplete,
    PullBackComplete,
}

impl Stage {
    fn to_code(&self) -> u8 {
        match self {
            Stage::FundsDeposited => 1,
            Stage::EscrowComplete => 2,
            Stage::PullBackComplete => 3,
        }
    }

    fn _from(val: u8) -> std::result::Result<Stage, ProgramError> {
        match val {
            1 => Ok(Stage::FundsDeposited),
            2 => Ok(Stage::EscrowComplete),
            3 => Ok(Stage::PullBackComplete),
            unknown_value => {
                msg!("Unknown stage: {}", unknown_value);
                Err(error!(ErrorCode::StageInvalid).into())
            }
        }
    }
}



#[account]
pub struct State {
    idx: u64, // WHY IS THIS HERE?
    sender: Pubkey,
    reciever: Pubkey,
    mint_of_token_being_sent: Pubkey,
    escrow_wallet: Pubkey,
    amount_of_tokens: u64,
    stage: u8,
    bump: u8
}

impl State {
    const LEN: usize = 8 // Discriminator Length
                + 8
                + 32 
                + 32
                + 32
                + 32
                + 8 
                + 1
                + 1;
}

#[derive(Accounts)]
#[instruction(application_idx: u64)]
pub struct InitializeNewGrant<'info> {
    // can not provide bump target
    // refer to https://github.com/project-serum/anchor/blob/master/CHANGELOG.md
    #[account(
        init, 
        space = State::LEN,
        payer = sender, 
        seeds = [b"application-state".as_ref(), sender.key().as_ref(), reciever.key().as_ref(), mint_of_token_being_sent.key().as_ref(), application_idx.to_le_bytes().as_ref()], 
        bump)]
    application_state: Account<'info, State>,

    // we do not need to provide space when 
    // initializing a SPL account.
    // TokenAccount is a fixed size struct with 
    // LEN const already implemented.
    #[account(
        init, 
        payer = sender, 
        seeds = [b"escrow-wallet-state".as_ref(), sender.key().as_ref(), reciever.key().as_ref(), mint_of_token_being_sent.key().as_ref(), application_idx.to_le_bytes().as_ref()], 
        bump,
        token::mint = mint_of_token_being_sent, 
        token::authority = application_state
    )]
    escrow_wallet_state: Account<'info, TokenAccount>,

    #[account(mut)]
    sender: Signer<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    reciever: AccountInfo<'info>, 
    mint_of_token_being_sent: Account<'info, Mint>,

    #[account(
        mut, 
        constraint = wallet_to_withdraw_from.owner == sender.key(), 
        constraint = wallet_to_withdraw_from.mint == mint_of_token_being_sent.key()
    )]
    //NOT sure what this is
    wallet_to_withdraw_from: Account<'info, TokenAccount>, 

    system_program: Program<'info, System>, 
    token_program: Program<'info, Token>, 

    //I dont think we will need this
    rent: Sysvar<'info, Rent>
}

#[derive(Accounts)]
pub struct Initialize {}

#[error_code]
pub enum ErrorCode {
    #[msg("Stage is invalid")]
    StageInvalid
}
