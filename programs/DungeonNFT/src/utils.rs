use anchor_lang::prelude::*;

use super::error::ErrorCode;

#[derive(Clone, Copy, PartialEq)]
pub enum Stage {
    Initialized,
    FundsDeposited,
    EscrowComplete,
}

impl Stage {
    pub fn to_code(&self) -> u8 {
        match self {
            Stage::Initialized => 1,
            Stage::FundsDeposited => 2,
            Stage::EscrowComplete => 3,
        }
    }

    pub fn from(val: u8) -> std::result::Result<Stage, ProgramError> {
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

pub fn secure_transfer_cpi<'info>(
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

pub fn close_account_cpi<'info>(
    escrow_account: AccountInfo<'info>,
    player: AccountInfo<'info>,
    transaction_state: AccountInfo<'info>,
    token_program: AccountInfo<'info>,
    signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    let close_escrow_account_instruction = anchor_spl::token::CloseAccount {
        account: escrow_account,
        destination: player,
        authority: transaction_state,
    };

    let close_escrow_account_cpi_ctx = CpiContext::new_with_signer(
        token_program.to_account_info(),
        close_escrow_account_instruction,
        signer_seeds,
    );

    anchor_spl::token::close_account(close_escrow_account_cpi_ctx)
}
