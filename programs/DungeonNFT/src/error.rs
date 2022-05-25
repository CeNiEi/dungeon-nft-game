use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Stage is invalid")]
    StageInvalid,

    #[msg("Insufficient balance")]
    NotEnoughBalance,
}
