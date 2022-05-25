use anchor_lang::prelude::*;

#[account]
pub struct TransactionState {
    pub player: Pubkey,
    pub beneficiary: Pubkey,
    pub mint_of_token: Pubkey,
    pub escrow_account: Pubkey,
    pub amount_of_tokens: u64,
    pub stage: u8,
    pub state_bump: u8,
    pub escrow_bump: u8,
}

impl TransactionState {
    pub const LEN: usize = 32 + 32 + 32 + 32 + 8 + 1 + 1 + 1;
}

#[account]
pub struct MarketState {
    pub fee_numerator: u64,
    pub fee_denominator: u64,
    pub state_bump: u8,
    pub token_vault_bump: u8,
    pub sol_vault_bump: u8,
}

impl MarketState {
    pub const LEN: usize = 8 + 8 + 8 + 1 + 1 + 1;
}
