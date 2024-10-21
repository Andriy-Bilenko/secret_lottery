use cosmwasm_std::{Addr, StdResult, Storage, Uint128};
use cosmwasm_storage::{singleton, singleton_read, ReadonlySingleton, Singleton};
use cw_storage_plus::Map;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

pub static CONFIG_KEY: &[u8] = b"config"; // identifier for State, for simpler namespace management and to organise state data to be in a predictable place

// moved out of state because not serializable and to use more complex data strucutures
pub const PARTICIPANTS: Map<String, bool> = Map::new("participants");

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
pub struct State {
    pub participation_fee_uscrt: Uint128,
    pub last_winner: Addr,
    pub participants_count: i32,
    pub owner: Addr,
}

pub fn config(storage: &mut dyn Storage) -> Singleton<State> {
    singleton(storage, CONFIG_KEY)
}

pub fn config_read(storage: &dyn Storage) -> ReadonlySingleton<State> {
    singleton_read(storage, CONFIG_KEY)
}

// to get a winner address
pub fn get_addr_at_index(index: u32) {}
// to add address to participants
pub fn add_participant(participant: Addr) {}
// check if a participant
pub fn is_participant(storage: &dyn Storage, addr: Addr) -> StdResult<bool> {
    let participant_exists = PARTICIPANTS.may_load(storage, addr.to_string())?;
    Ok(participant_exists.is_some())
    // Ok(PARTICIPANTS.may_load(storage, &addr)?.is_some())
}

// cleaning up after ending the lottery
pub fn clear_participants() {}
// return a Vec<Addr>
pub fn get_all_participants_vector() {}
