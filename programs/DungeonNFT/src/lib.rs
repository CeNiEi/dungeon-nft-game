use anchor_lang::prelude::*;
use anchor_spl::{token::{TokenAccount, Mint, Token}, associated_token::AssociatedToken};

declare_id!("5p3fWKASxACkTksYqPci3PAd2NKXmtwTRR1QyN7q6ogi");

fn transfer_escrow_out<'info>(
    sender: AccountInfo<'info>,
    receiver: AccountInfo<'info>,
    mint_of_token_being_sent: AccountInfo<'info>,
    escrow_wallet: &mut Account<'info, TokenAccount>,
    application_idx: u64,
    state: AccountInfo<'info>,
    state_bump: u8,
    token_program: AccountInfo<'info>,
    destination_wallet: AccountInfo<'info>,
    amount: u64
) -> Result<()> {

    let bump_vector = state_bump.to_le_bytes();
    let mint_of_token_being_sent_pk = mint_of_token_being_sent.key().clone();
    let application_idx_bytes = application_idx.to_le_bytes();
    let inner = vec![
        b"application-state".as_ref(),
        sender.key.as_ref(),
        receiver.key.as_ref(),
        mint_of_token_being_sent_pk.as_ref(), 
        application_idx_bytes.as_ref(),
        bump_vector.as_ref(),
    ];
    let outer = vec![inner.as_slice()];

    let transfer_instruction = anchor_spl::token::Transfer{
        from: escrow_wallet.to_account_info(),
        to: destination_wallet,
        authority: state.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        token_program.to_account_info(),
        transfer_instruction,
        outer.as_slice(),
    );
    anchor_spl::token::transfer(cpi_ctx, amount)?;

    let should_close = {
        escrow_wallet.reload()?;
        escrow_wallet.amount == 0
    };

    if should_close {
        let ca = anchor_spl::token::CloseAccount{
            account: escrow_wallet.to_account_info(),
            destination: sender.to_account_info(),
            authority: state.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            token_program.to_account_info(),
            ca,
            outer.as_slice(),
        );
        anchor_spl::token::close_account(cpi_ctx)?;
    }

    Ok(())
}


#[program]
pub mod dungeon_nft {
    use anchor_spl::token::Transfer;

    use super::*;

    pub fn complete_grant(ctx: Context<CompleteGrant>, application_idx: u64) -> Result<()> {
        if Stage::from(ctx.accounts.application_state.stage)? != Stage::FundsDeposited {
            msg!("Stage is invalid, state stage is {}", ctx.accounts.application_state.stage);
            return Err(ErrorCode::StageInvalid.into());
        }

        transfer_escrow_out(
            ctx.accounts.sender.to_account_info(),
            ctx.accounts.receiver.to_account_info(),
            ctx.accounts.mint_of_token_being_sent.to_account_info(),
            &mut ctx.accounts.escrow_wallet_state,
            application_idx,
            ctx.accounts.application_state.to_account_info(),
            ctx.accounts.application_state.state_bump,
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.wallet_to_deposit_to.to_account_info(),
            ctx.accounts.application_state.amount_of_tokens
        )?;

        let state = &mut ctx.accounts.application_state;
        state.stage = Stage::EscrowComplete.to_code();
        Ok(())
    }

 

    pub fn initialize_new_grant(ctx: Context<InitializeNewGrant>, application_idx: u64, amount: u64) -> Result<()> {
        let state = &mut ctx.accounts.application_state;

        state.idx = application_idx;
        state.sender = ctx.accounts.sender.key().clone();
        state.receiver = ctx.accounts.receiver.key().clone();
        state.mint_of_token_being_sent = ctx.accounts.mint_of_token_being_sent.key().clone();
        state.escrow_wallet = ctx.accounts.escrow_wallet_state.key().clone();
        state.amount_of_tokens = amount;

        let state_bump = *ctx.bumps.get("application_state").unwrap();
        state.state_bump = state_bump;
        state.wallet_bump = *ctx.bumps.get("escrow_wallet_state").unwrap();

        msg!("Initialized new Safe Transfer instance for {}", amount);

        let bump_vector = state_bump.to_le_bytes();
        let mint_of_token_being_sent_pk = ctx.accounts.mint_of_token_being_sent.key().clone();
        let application_idx_bytes = application_idx.to_le_bytes();

        let inner = vec![
            b"application-state".as_ref(), 
            ctx.accounts.sender.key.as_ref(),
            ctx.accounts.receiver.key.as_ref(), 
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

    fn from(val: u8) -> std::result::Result<Stage, ProgramError> {
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
    idx: u64,
    sender: Pubkey,
    receiver: Pubkey,
    mint_of_token_being_sent: Pubkey,
    escrow_wallet: Pubkey,
    amount_of_tokens: u64,
    stage: u8,
    state_bump: u8,
    wallet_bump: u8
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
        seeds = [
            b"application-state".as_ref(), 
            sender.key().as_ref(),
            receiver.key().as_ref(), 
            mint_of_token_being_sent.key().as_ref(), 
            application_idx.to_le_bytes().as_ref()], 
        bump)]
    application_state: Account<'info, State>,

    #[account(
        init, 
        payer = sender, 
        seeds = [
            b"escrow-wallet-state".as_ref(), 
            sender.key().as_ref(), 
            receiver.key().as_ref(), 
            mint_of_token_being_sent.key().as_ref(), 
            application_idx.to_le_bytes().as_ref()], 
        bump,
        token::mint = mint_of_token_being_sent, 
        token::authority = application_state
    )]
    escrow_wallet_state: Account<'info, TokenAccount>,

    #[account(mut)]
    sender: Signer<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    receiver: AccountInfo<'info>, 
    mint_of_token_being_sent: Account<'info, Mint>,

    #[account(
        mut, 
        constraint = wallet_to_withdraw_from.owner == sender.key(), 
        constraint = wallet_to_withdraw_from.mint == mint_of_token_being_sent.key()
    )]
    wallet_to_withdraw_from: Account<'info, TokenAccount>, 

    system_program: Program<'info, System>, 
    token_program: Program<'info, Token>, 

    rent: Sysvar<'info, Rent> //Why this?
}

#[derive(Accounts)]
#[instruction(application_idx: u64)]
pub struct CompleteGrant<'info> {
    #[account(
        mut,
        seeds = [
            b"application-state".as_ref(), 
            sender.key().as_ref(), 
            receiver.key.as_ref(), 
            mint_of_token_being_sent.key().as_ref(), 
            application_idx.to_le_bytes().as_ref()],
        bump = application_state.state_bump,
        has_one = sender,
        has_one = receiver,
        has_one = mint_of_token_being_sent,
    )]
    application_state: Account<'info, State>,
    #[account(
        mut,
        seeds=[
            b"escrow-wallet-state".as_ref(), 
            sender.key().as_ref(), 
            receiver.key.as_ref(), 
            mint_of_token_being_sent.key().as_ref(), 
            application_idx.to_le_bytes().as_ref()],
        bump = application_state.wallet_bump,
    )]
    escrow_wallet_state: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = receiver,
        associated_token::mint = mint_of_token_being_sent,
        associated_token::authority = receiver,
    )]
    wallet_to_deposit_to: Account<'info, TokenAccount>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    sender: AccountInfo<'info>,                   
    #[account(mut)]
    receiver: Signer<'info>,                       
    mint_of_token_being_sent: Account<'info, Mint>,       

    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
    associated_token_program: Program<'info, AssociatedToken>,
    rent: Sysvar<'info, Rent>,
}


#[derive(Accounts)]
pub struct Initialize {}

#[error_code]
pub enum ErrorCode {
    #[msg("Stage is invalid")]
    StageInvalid
}
