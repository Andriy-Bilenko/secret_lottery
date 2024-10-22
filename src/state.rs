use cosmwasm_std::Addr;
use cosmwasm_std::{Deps, DepsMut, StdError, StdResult};
use schemars::JsonSchema;
use secret_toolkit::storage::{Keymap, KeymapBuilder};
use secret_toolkit::{serialization::Bincode2, storage::Item};
use serde::{Deserialize, Serialize};

pub static CONFIG: Item<State> = Item::new(b"config");

// moved out of state because not serializable and to use more complex data strucutures
pub const PARTICIPANTS: Keymap<Addr, bool, Bincode2> = KeymapBuilder::new(b"secrets").build();

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
pub struct State {
    pub participation_fee_uscrt: u128,
    pub last_winner: Addr,
    pub participants_count: i32, // temporarily unused
    pub owner: Addr,
}

// to get a winner address
pub fn get_addr_at_index(deps: Deps, index: u32) -> StdResult<Addr> {
    // first check if index is not too big compared to participants length
    if index + 1 > PARTICIPANTS.get_len(deps.storage).unwrap() {
        return Err(StdError::generic_err(
            "index out of bounds at get_addr_at_index()",
        ));
    }
    let participants = &PARTICIPANTS;
    let mut iter = participants.iter_keys(deps.storage).unwrap();
    let mut start_index = 0;
    while let Some(key_result) = iter.next() {
        if start_index == index {
            return Ok(key_result.unwrap());
        }
        start_index += 1;
    }
    return Err(StdError::generic_err(
        "unknown error in get_addr_at_index()",
    ));
}
// to add address to participants
pub fn add_participant(deps: DepsMut, participant: Addr) {
    PARTICIPANTS
        .insert(deps.storage, &participant, &false)
        .unwrap();
}
// check if a participant
pub fn is_participant(deps: Deps, addr: Addr) -> StdResult<bool> {
    Ok(PARTICIPANTS.contains(deps.storage, &addr))
}

// cleaning up after ending the lottery
pub fn clear_participants(deps: DepsMut) {
    let participants = &PARTICIPANTS;
    let keys = get_all_participants_vector(deps.as_ref()).unwrap();
    for key in keys {
        participants.remove(deps.storage, &key).unwrap();
    }
}
// return a Vec<Addr>
pub fn get_all_participants_vector(deps: Deps) -> StdResult<Vec<Addr>> {
    let participants = &PARTICIPANTS;
    let mut iter = participants.iter_keys(deps.storage).unwrap();
    let mut keys = Vec::new();
    while let Some(key_result) = iter.next() {
        match key_result {
            Ok(key) => keys.push(key),
            Err(e) => {
                return Err(StdError::generic_err(format!(
                    "Error iterating keys: {}",
                    e
                )))
            }
        }
    }
    Ok(keys)
}
