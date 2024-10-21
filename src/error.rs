use thiserror::Error;

#[derive(Error, Debug, PartialEq)]
pub enum ContractError {
    #[error("Zero Participants")]
    // issued when owner tries to finish lottery with no participants
    ZeroParticipants {},

    #[error("No Last Winner")]
    // issued when user queries contract for last winner and this is the first lottery
    NoLastWinner {},

    #[error("Unauthorized")]
    // issued when not owner tries to finish the lottery
    Unauthorized {},

    #[error("Already Participating")]
    // issued when user tries to participate but is already there
    AlreadyParticipating {},
}
